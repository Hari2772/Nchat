import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../utils/logger.dart';
import '../utils/constants.dart';
import 'api_service.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  Position? _currentPosition;
  Timer? _locationTimer;
  StreamSubscription<Position>? _positionStream;
  final ApiServiceClient _apiClient = ApiServiceClient();
  
  // Privacy settings
  bool _locationEnabled = false;
  String _privacyLevel = 'friends'; // public, friends, private
  int _updateInterval = 300000; // 5 minutes
  double _minDistanceFilter = 10.0; // 10 meters
  Position? _lastReportedPosition;

  // Distance calculation cache
  final Map<String, double> _distanceCache = {};
  final Map<String, String> _colorCache = {};

  // Location history for privacy
  final List<LocationHistoryEntry> _locationHistory = [];
  static const int _maxHistorySize = 100;

  // Privacy zones (areas where location is not shared)
  final List<PrivacyZone> _privacyZones = [];

  // Event streams
  final StreamController<LocationUpdate> _locationController = StreamController<LocationUpdate>.broadcast();
  final StreamController<NearbyUsersUpdate> _nearbyController = StreamController<NearbyUsersUpdate>.broadcast();

  Stream<LocationUpdate> get locationStream => _locationController.stream;
  Stream<NearbyUsersUpdate> get nearbyStream => _nearbyController.stream;

  // Getters
  Position? get currentPosition => _currentPosition;
  bool get locationEnabled => _locationEnabled;
  String get privacyLevel => _privacyLevel;

  /// Initialize location service
  Future<bool> initialize() async {
    try {
      // Check permissions
      final permissionStatus = await _checkPermissions();
      if (!permissionStatus) {
        Logger.warning('Location permissions not granted');
        return false;
      }

      // Check if location services are enabled
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        Logger.warning('Location services are disabled');
        return false;
      }

      // Load privacy settings
      await _loadPrivacySettings();

      // Get initial position
      await _getCurrentPosition();

      // Start location updates
      await _startLocationUpdates();

      Logger.info('Location service initialized successfully');
      return true;
    } catch (e) {
      Logger.error('Failed to initialize location service: $e');
      return false;
    }
  }

  /// Check and request location permissions
  Future<bool> _checkPermissions() async {
    try {
      // Check location permission
      LocationPermission permission = await Geolocator.checkPermission();
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        // Open app settings
        await openAppSettings();
        return false;
      }

      // Check additional permissions
      final status = await Permission.location.status;
      if (!status.isGranted) {
        final result = await Permission.location.request();
        if (!result.isGranted) {
          return false;
        }
      }

      return true;
    } catch (e) {
      Logger.error('Permission check failed: $e');
      return false;
    }
  }

  /// Load privacy settings from storage
  Future<void> _loadPrivacySettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _locationEnabled = prefs.getBool('location_enabled') ?? true;
      _privacyLevel = prefs.getString('location_privacy_level') ?? 'friends';
      _updateInterval = prefs.getInt('location_update_interval') ?? 300000;
      _minDistanceFilter = prefs.getDouble('location_min_distance') ?? 10.0;
    } catch (e) {
      Logger.error('Failed to load privacy settings: $e');
    }
  }

  /// Save privacy settings to storage
  Future<void> _savePrivacySettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('location_enabled', _locationEnabled);
      await prefs.setString('location_privacy_level', _privacyLevel);
      await prefs.setInt('location_update_interval', _updateInterval);
      await prefs.setDouble('location_min_distance', _minDistanceFilter);
    } catch (e) {
      Logger.error('Failed to save privacy settings: $e');
    }
  }

  /// Get current position
  Future<Position?> _getCurrentPosition() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 10),
      );

      _currentPosition = position;
      _addToHistory(position);
      
      Logger.info('Current position obtained: ${position.latitude}, ${position.longitude}');
      return position;
    } catch (e) {
      Logger.error('Failed to get current position: $e');
      return null;
    }
  }

  /// Start location updates
  Future<void> _startLocationUpdates() async {
    if (!_locationEnabled) return;

    try {
      // Start position stream
      _positionStream = Geolocator.getPositionStream(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: _minDistanceFilter,
          timeLimit: Duration(seconds: 10),
        ),
      ).listen(
        (Position position) {
          _onPositionUpdate(position);
        },
        onError: (error) {
          Logger.error('Position stream error: $error');
        },
      );

      // Start periodic updates
      _locationTimer = Timer.periodic(Duration(milliseconds: _updateInterval), (timer) {
        _updateLocation();
      });

      Logger.info('Location updates started');
    } catch (e) {
      Logger.error('Failed to start location updates: $e');
    }
  }

  /// Handle position updates
  void _onPositionUpdate(Position position) {
    try {
      // Check if position has changed significantly
      if (_shouldUpdatePosition(position)) {
        _currentPosition = position;
        _addToHistory(position);
        
        // Emit location update
        _locationController.add(LocationUpdate(
          position: position,
          timestamp: DateTime.now(),
          privacyLevel: _privacyLevel,
        ));

        // Update location on server if privacy allows
        if (_shouldReportToServer()) {
          _updateLocationOnServer(position);
        }

        _lastReportedPosition = position;
      }
    } catch (e) {
      Logger.error('Position update handling failed: $e');
    }
  }

  /// Check if position should be updated
  bool _shouldUpdatePosition(Position newPosition) {
    if (_currentPosition == null) return true;

    final distance = Geolocator.distanceBetween(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      newPosition.latitude,
      newPosition.longitude,
    );

    return distance >= _minDistanceFilter;
  }

  /// Check if location should be reported to server
  bool _shouldReportToServer() {
    if (_privacyLevel == 'private') return false;
    if (_currentPosition == null) return false;

    // Check if in privacy zone
    for (final zone in _privacyZones) {
      if (_isInPrivacyZone(_currentPosition!, zone)) {
        return false;
      }
    }

    return true;
  }

  /// Check if position is in privacy zone
  bool _isInPrivacyZone(Position position, PrivacyZone zone) {
    final distance = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      zone.latitude,
      zone.longitude,
    );

    return distance <= zone.radius;
  }

  /// Add position to history
  void _addToHistory(Position position) {
    _locationHistory.add(LocationHistoryEntry(
      position: position,
      timestamp: DateTime.now(),
    ));

    // Keep only recent history
    if (_locationHistory.length > _maxHistorySize) {
      _locationHistory.removeAt(0);
    }
  }

  /// Update location on server
  Future<void> _updateLocationOnServer(Position position) async {
    try {
      // Get address information
      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      final placemark = placemarks.isNotEmpty ? placemarks.first : null;
      final address = placemark != null
          ? '${placemark.street}, ${placemark.locality}, ${placemark.country}'
          : '';

      // Send to server
      await _apiClient.apiService.updateLocation(
        LocationUpdateRequest(
          latitude: position.latitude,
          longitude: position.longitude,
          privacyLevel: _privacyLevel,
        ),
      );

      Logger.info('Location updated on server');
    } catch (e) {
      Logger.error('Failed to update location on server: $e');
    }
  }

  /// Calculate distance between two points (privacy-safe)
  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    final cacheKey = '${lat1}_${lon1}_${lat2}_${lon2}';
    
    if (_distanceCache.containsKey(cacheKey)) {
      return _distanceCache[cacheKey]!;
    }

    final distance = Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
    _distanceCache[cacheKey] = distance;

    // Clear cache if too large
    if (_distanceCache.length > 1000) {
      _distanceCache.clear();
    }

    return distance;
  }

  /// Get color based on distance (privacy-safe)
  String getDistanceColor(double distance) {
    if (distance <= 10) return 'green'; // 0-10m
    if (distance <= 3000) return 'blue'; // 10m-3km
    if (distance <= 80000) return 'orange'; // 3km-80km
    return 'gray'; // 80km+
  }

  /// Get distance color for user (cached)
  String getUserDistanceColor(String userId, double userLat, double userLon) {
    if (_currentPosition == null) return 'gray';

    final cacheKey = '${userId}_color';
    if (_colorCache.containsKey(cacheKey)) {
      return _colorCache[cacheKey]!;
    }

    final distance = calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      userLat,
      userLon,
    );

    final color = getDistanceColor(distance);
    _colorCache[cacheKey] = color;

    return color;
  }

  /// Get nearby users (privacy-safe)
  Future<List<NearbyUser>> getNearbyUsers({
    int maxDistance = 50000,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      if (_currentPosition == null) {
        throw Exception('Current position not available');
      }

      // Check connectivity
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity == ConnectivityResult.none) {
        throw Exception('No internet connection');
      }

      // Get nearby users from server
      final users = await _apiClient.apiService.getNearbyUsers(
        maxDistance: maxDistance,
        page: page,
        limit: limit,
      );

      // Calculate distances and colors locally
      final nearbyUsers = users.map((user) {
        final distance = calculateDistance(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          user.location.latitude,
          user.location.longitude,
        );

        final color = getDistanceColor(distance);

        return NearbyUser(
          user: user,
          distance: distance,
          color: color,
          lastSeen: user.lastSeen,
        );
      }).toList();

      // Sort by distance
      nearbyUsers.sort((a, b) => a.distance.compareTo(b.distance));

      // Emit nearby users update
      _nearbyController.add(NearbyUsersUpdate(
        users: nearbyUsers,
        timestamp: DateTime.now(),
      ));

      return nearbyUsers;
    } catch (e) {
      Logger.error('Failed to get nearby users: $e');
      rethrow;
    }
  }

  /// Update location manually
  Future<void> updateLocation() async {
    try {
      final position = await _getCurrentPosition();
      if (position != null) {
        _onPositionUpdate(position);
      }
    } catch (e) {
      Logger.error('Manual location update failed: $e');
    }
  }

  /// Set privacy level
  Future<void> setPrivacyLevel(String level) async {
    if (!['public', 'friends', 'private'].contains(level)) {
      throw ArgumentError('Invalid privacy level: $level');
    }

    _privacyLevel = level;
    await _savePrivacySettings();

    // Update location on server if needed
    if (_currentPosition != null && _shouldReportToServer()) {
      await _updateLocationOnServer(_currentPosition!);
    }

    Logger.info('Privacy level updated to: $level');
  }

  /// Enable/disable location tracking
  Future<void> setLocationEnabled(bool enabled) async {
    _locationEnabled = enabled;
    await _savePrivacySettings();

    if (enabled) {
      await _startLocationUpdates();
    } else {
      _stopLocationUpdates();
    }

    Logger.info('Location tracking ${enabled ? 'enabled' : 'disabled'}');
  }

  /// Set update interval
  Future<void> setUpdateInterval(int milliseconds) async {
    _updateInterval = milliseconds;
    await _savePrivacySettings();

    if (_locationEnabled) {
      _stopLocationUpdates();
      await _startLocationUpdates();
    }

    Logger.info('Update interval set to: ${milliseconds}ms');
  }

  /// Add privacy zone
  void addPrivacyZone(PrivacyZone zone) {
    _privacyZones.add(zone);
    Logger.info('Privacy zone added: ${zone.name}');
  }

  /// Remove privacy zone
  void removePrivacyZone(String zoneId) {
    _privacyZones.removeWhere((zone) => zone.id == zoneId);
    Logger.info('Privacy zone removed: $zoneId');
  }

  /// Get location history (privacy-safe)
  List<LocationHistoryEntry> getLocationHistory() {
    return List.unmodifiable(_locationHistory);
  }

  /// Clear location history
  void clearLocationHistory() {
    _locationHistory.clear();
    Logger.info('Location history cleared');
  }

  /// Stop location updates
  void _stopLocationUpdates() {
    _locationTimer?.cancel();
    _positionStream?.cancel();
    Logger.info('Location updates stopped');
  }

  /// Dispose resources
  void dispose() {
    _stopLocationUpdates();
    _locationController.close();
    _nearbyController.close();
    _distanceCache.clear();
    _colorCache.clear();
    _locationHistory.clear();
  }
}

// Data classes
class LocationUpdate {
  final Position position;
  final DateTime timestamp;
  final String privacyLevel;

  LocationUpdate({
    required this.position,
    required this.timestamp,
    required this.privacyLevel,
  });
}

class NearbyUsersUpdate {
  final List<NearbyUser> users;
  final DateTime timestamp;

  NearbyUsersUpdate({
    required this.users,
    required this.timestamp,
  });
}

class NearbyUser {
  final UserModel user;
  final double distance;
  final String color;
  final DateTime lastSeen;

  NearbyUser({
    required this.user,
    required this.distance,
    required this.color,
    required this.lastSeen,
  });
}

class LocationHistoryEntry {
  final Position position;
  final DateTime timestamp;

  LocationHistoryEntry({
    required this.position,
    required this.timestamp,
  });
}

class PrivacyZone {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final double radius; // in meters

  PrivacyZone({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    required this.radius,
  });
}

// User model (simplified for location service)
class UserModel {
  final String id;
  final String username;
  final String displayName;
  final String? profilePicture;
  final UserLocation location;
  final DateTime lastSeen;

  UserModel({
    required this.id,
    required this.username,
    required this.displayName,
    this.profilePicture,
    required this.location,
    required this.lastSeen,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'],
      username: json['username'],
      displayName: json['displayName'],
      profilePicture: json['profilePicture'],
      location: UserLocation.fromJson(json['location']),
      lastSeen: DateTime.parse(json['lastSeen']),
    );
  }
}

class UserLocation {
  final double latitude;
  final double longitude;
  final DateTime lastUpdated;
  final String privacyLevel;

  UserLocation({
    required this.latitude,
    required this.longitude,
    required this.lastUpdated,
    required this.privacyLevel,
  });

  factory UserLocation.fromJson(Map<String, dynamic> json) {
    return UserLocation(
      latitude: json['coordinates'][1].toDouble(),
      longitude: json['coordinates'][0].toDouble(),
      lastUpdated: DateTime.parse(json['lastUpdated']),
      privacyLevel: json['privacyLevel'],
    );
  }
}