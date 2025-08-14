import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../models/user_model.dart';
import '../models/message_model.dart';
import '../models/story_model.dart';
import '../models/streak_model.dart';
import '../utils/constants.dart';
import '../utils/logger.dart';

part 'api_service.g.dart';

@RestApi(baseUrl: AppConstants.apiBaseUrl)
abstract class ApiService {
  factory ApiService(Dio dio, {String baseUrl}) = _ApiService;

  // Authentication endpoints
  @POST('/auth/google')
  Future<AuthResponse> authenticateWithGoogle(@Body() GoogleAuthRequest request);

  @POST('/auth/refresh')
  Future<AuthResponse> refreshToken(@Body() RefreshTokenRequest request);

  @POST('/auth/logout')
  Future<void> logout(@Body() LogoutRequest request);

  @POST('/auth/admin')
  Future<AuthResponse> authenticateAdmin(@Body() AdminAuthRequest request);

  // User endpoints
  @GET('/users/profile')
  Future<UserModel> getProfile();

  @PUT('/users/profile')
  Future<UserModel> updateProfile(@Body() UpdateProfileRequest request);

  @PUT('/users/location')
  Future<void> updateLocation(@Body() LocationUpdateRequest request);

  @GET('/users/nearby')
  Future<List<UserModel>> getNearbyUsers({
    @Query('maxDistance') int maxDistance = 50000,
    @Query('page') int page = 1,
    @Query('limit') int limit = 50,
  });

  @GET('/users/search')
  Future<List<UserModel>> searchUsers({
    @Query('q') required String query,
    @Query('page') int page = 1,
    @Query('limit') int limit = 50,
  });

  @POST('/users/friend-request')
  Future<void> sendFriendRequest(@Body() FriendRequestRequest request);

  @PUT('/users/friend-request/{requestId}/accept')
  Future<void> acceptFriendRequest(@Path('requestId') String requestId);

  @PUT('/users/friend-request/{requestId}/reject')
  Future<void> rejectFriendRequest(@Path('requestId') String requestId);

  @GET('/users/friends')
  Future<List<UserModel>> getFriends();

  @GET('/users/friend-requests')
  Future<List<FriendRequestModel>> getFriendRequests();

  @DELETE('/users/friends/{friendId}')
  Future<void> removeFriend(@Path('friendId') String friendId);

  @POST('/users/block/{userId}')
  Future<void> blockUser(@Path('userId') String userId);

  @DELETE('/users/block/{userId}')
  Future<void> unblockUser(@Path('userId') String userId);

  // Story endpoints
  @GET('/stories/nearby')
  Future<List<StoryModel>> getNearbyStories({
    @Query('maxDistance') int maxDistance = 50000,
    @Query('page') int page = 1,
    @Query('limit') int limit = 50,
  });

  @POST('/stories')
  @MultiPart()
  Future<StoryModel> createStory(@Part() String storyData, @Part() File? mediaFile);

  @GET('/stories/{storyId}')
  Future<StoryModel> getStory(@Path('storyId') String storyId);

  @PUT('/stories/{storyId}/view')
  Future<void> viewStory(@Path('storyId') String storyId);

  @POST('/stories/{storyId}/reaction')
  Future<void> reactToStory(@Path('storyId') String storyId, @Body() StoryReactionRequest request);

  @POST('/stories/{storyId}/comment')
  Future<void> commentOnStory(@Path('storyId') String storyId, @Body() StoryCommentRequest request);

  @DELETE('/stories/{storyId}')
  Future<void> deleteStory(@Path('storyId') String storyId);

  @POST('/stories/{storyId}/live-stream/start')
  Future<LiveStreamResponse> startLiveStream(@Path('storyId') String storyId);

  @POST('/stories/{storyId}/live-stream/end')
  Future<void> endLiveStream(@Path('storyId') String storyId);

  // Message endpoints
  @GET('/messages/conversation/{conversationId}')
  Future<List<MessageModel>> getConversationMessages(
    @Path('conversationId') String conversationId,
    @Query('page') int page = 1,
    @Query('limit') int limit = 50,
  );

  @POST('/messages')
  @MultiPart()
  Future<MessageModel> sendMessage(@Part() String messageData, @Part() File? mediaFile);

  @PUT('/messages/{messageId}/read')
  Future<void> markMessageAsRead(@Path('messageId') String messageId);

  @PUT('/messages/{messageId}/reaction')
  Future<void> reactToMessage(@Path('messageId') String messageId, @Body() MessageReactionRequest request);

  @PUT('/messages/{messageId}')
  Future<MessageModel> editMessage(@Path('messageId') String messageId, @Body() EditMessageRequest request);

  @DELETE('/messages/{messageId}')
  Future<void> deleteMessage(@Path('messageId') String messageId);

  @POST('/messages/{messageId}/forward')
  Future<void> forwardMessage(@Path('messageId') String messageId, @Body() ForwardMessageRequest request);

  // Streak endpoints
  @GET('/streaks/current')
  Future<StreakModel> getCurrentStreak();

  @GET('/streaks/history')
  Future<List<StreakModel>> getStreakHistory({
    @Query('days') int days = 30,
  });

  @POST('/streaks/check-in')
  Future<StreakModel> checkIn();

  @GET('/streaks/leaderboard')
  Future<List<StreakLeaderboardModel>> getStreakLeaderboard({
    @Query('limit') int limit = 100,
  });

  // Admin endpoints
  @GET('/admin/dashboard')
  Future<AdminDashboardModel> getAdminDashboard();

  @POST('/admin/announcement')
  Future<void> createAnnouncement(@Body() AnnouncementRequest request);

  @GET('/admin/users')
  Future<List<UserModel>> getAdminUsers({
    @Query('page') int page = 1,
    @Query('limit') int limit = 50,
    @Query('status') String? status,
  });

  @PUT('/admin/users/{userId}/status')
  Future<void> updateUserStatus(@Path('userId') String userId, @Body() UpdateUserStatusRequest request);

  // Utility endpoints
  @POST('/upload')
  @MultiPart()
  Future<UploadResponse> uploadFile(@Part() File file);

  @POST('/fcm-token')
  Future<void> updateFcmToken(@Body() FcmTokenRequest request);

  @GET('/health')
  Future<HealthResponse> healthCheck();
}

class ApiServiceClient {
  static final ApiServiceClient _instance = ApiServiceClient._internal();
  factory ApiServiceClient() => _instance;
  ApiServiceClient._internal();

  late Dio _dio;
  late ApiService _apiService;
  final FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  Future<void> initialize() async {
    _dio = Dio(BaseOptions(
      baseUrl: AppConstants.apiBaseUrl,
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      sendTimeout: Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors
    _dio.interceptors.addAll([
      _AuthInterceptor(_secureStorage),
      _LoggingInterceptor(),
      _ErrorInterceptor(),
      _RetryInterceptor(),
    ]);

    _apiService = ApiService(_dio);
  }

  ApiService get apiService => _apiService;

  Future<void> setAuthToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<void> clearAuthToken() async {
    await _secureStorage.delete(key: 'auth_token');
    _dio.options.headers.remove('Authorization');
  }

  Future<String?> getAuthToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }
}

// Interceptors
class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _secureStorage;

  _AuthInterceptor(this._secureStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _secureStorage.read(key: 'auth_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401) {
      // Token expired, try to refresh
      try {
        final refreshToken = await _secureStorage.read(key: 'refresh_token');
        if (refreshToken != null) {
          final dio = Dio();
          final response = await dio.post(
            '${AppConstants.apiBaseUrl}/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          if (response.statusCode == 200) {
            final newToken = response.data['data']['accessToken'];
            final newRefreshToken = response.data['data']['refreshToken'];

            await _secureStorage.write(key: 'auth_token', value: newToken);
            await _secureStorage.write(key: 'refresh_token', value: newRefreshToken);

            // Retry original request
            err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
            final retryResponse = await dio.fetch(err.requestOptions);
            handler.resolve(retryResponse);
            return;
          }
        }
      } catch (e) {
        Logger.error('Token refresh failed: $e');
        // Clear tokens and redirect to login
        await _secureStorage.deleteAll();
      }
    }
    handler.next(err);
  }
}

class _LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    Logger.info('API Request: ${options.method} ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    Logger.info('API Response: ${response.statusCode} ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    Logger.error('API Error: ${err.response?.statusCode} ${err.requestOptions.path} - ${err.message}');
    handler.next(err);
  }
}

class _ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      Logger.error('Network timeout: ${err.message}');
    } else if (err.type == DioExceptionType.connectionError) {
      Logger.error('Network connection error: ${err.message}');
    }
    handler.next(err);
  }
}

class _RetryInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRetry(err) && err.requestOptions.extra['retryCount'] == null) {
      err.requestOptions.extra['retryCount'] = 1;
      
      try {
        await Future.delayed(Duration(seconds: 2));
        final response = await Dio().fetch(err.requestOptions);
        handler.resolve(response);
        return;
      } catch (retryError) {
        Logger.error('Retry failed: $retryError');
      }
    }
    handler.next(err);
  }

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.connectionError ||
           (err.response?.statusCode ?? 0) >= 500;
  }
}

// Request/Response models
@JsonSerializable()
class AuthResponse {
  final bool success;
  final String message;
  final AuthData data;

  AuthResponse({
    required this.success,
    required this.message,
    required this.data,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}

@JsonSerializable()
class AuthData {
  final UserModel user;
  final String accessToken;
  final String refreshToken;

  AuthData({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthData.fromJson(Map<String, dynamic> json) => _$AuthDataFromJson(json);
  Map<String, dynamic> toJson() => _$AuthDataToJson(this);
}

@JsonSerializable()
class GoogleAuthRequest {
  final String token;

  GoogleAuthRequest({required this.token});

  factory GoogleAuthRequest.fromJson(Map<String, dynamic> json) => _$GoogleAuthRequestFromJson(json);
  Map<String, dynamic> toJson() => _$GoogleAuthRequestToJson(this);
}

@JsonSerializable()
class RefreshTokenRequest {
  final String refreshToken;

  RefreshTokenRequest({required this.refreshToken});

  factory RefreshTokenRequest.fromJson(Map<String, dynamic> json) => _$RefreshTokenRequestFromJson(json);
  Map<String, dynamic> toJson() => _$RefreshTokenRequestToJson(this);
}

@JsonSerializable()
class LogoutRequest {
  final String refreshToken;

  LogoutRequest({required this.refreshToken});

  factory LogoutRequest.fromJson(Map<String, dynamic> json) => _$LogoutRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LogoutRequestToJson(this);
}

@JsonSerializable()
class AdminAuthRequest {
  final String email;
  final String password;

  AdminAuthRequest({required this.email, required this.password});

  factory AdminAuthRequest.fromJson(Map<String, dynamic> json) => _$AdminAuthRequestFromJson(json);
  Map<String, dynamic> toJson() => _$AdminAuthRequestToJson(this);
}

@JsonSerializable()
class LocationUpdateRequest {
  final double latitude;
  final double longitude;
  final String privacyLevel;

  LocationUpdateRequest({
    required this.latitude,
    required this.longitude,
    this.privacyLevel = 'friends',
  });

  factory LocationUpdateRequest.fromJson(Map<String, dynamic> json) => _$LocationUpdateRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LocationUpdateRequestToJson(this);
}

@JsonSerializable()
class UpdateProfileRequest {
  final String? displayName;
  final String? bio;
  final String? profilePicture;

  UpdateProfileRequest({
    this.displayName,
    this.bio,
    this.profilePicture,
  });

  factory UpdateProfileRequest.fromJson(Map<String, dynamic> json) => _$UpdateProfileRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateProfileRequestToJson(this);
}

@JsonSerializable()
class FriendRequestRequest {
  final String friendId;

  FriendRequestRequest({required this.friendId});

  factory FriendRequestRequest.fromJson(Map<String, dynamic> json) => _$FriendRequestRequestFromJson(json);
  Map<String, dynamic> toJson() => _$FriendRequestRequestToJson(this);
}

@JsonSerializable()
class StoryReactionRequest {
  final String type;

  StoryReactionRequest({required this.type});

  factory StoryReactionRequest.fromJson(Map<String, dynamic> json) => _$StoryReactionRequestFromJson(json);
  Map<String, dynamic> toJson() => _$StoryReactionRequestToJson(this);
}

@JsonSerializable()
class StoryCommentRequest {
  final String text;

  StoryCommentRequest({required this.text});

  factory StoryCommentRequest.fromJson(Map<String, dynamic> json) => _$StoryCommentRequestFromJson(json);
  Map<String, dynamic> toJson() => _$StoryCommentRequestToJson(this);
}

@JsonSerializable()
class MessageReactionRequest {
  final String type;

  MessageReactionRequest({required this.type});

  factory MessageReactionRequest.fromJson(Map<String, dynamic> json) => _$MessageReactionRequestFromJson(json);
  Map<String, dynamic> toJson() => _$MessageReactionRequestToJson(this);
}

@JsonSerializable()
class EditMessageRequest {
  final String text;

  EditMessageRequest({required this.text});

  factory EditMessageRequest.fromJson(Map<String, dynamic> json) => _$EditMessageRequestFromJson(json);
  Map<String, dynamic> toJson() => _$EditMessageRequestToJson(this);
}

@JsonSerializable()
class ForwardMessageRequest {
  final String receiverId;

  ForwardMessageRequest({required this.receiverId});

  factory ForwardMessageRequest.fromJson(Map<String, dynamic> json) => _$ForwardMessageRequestFromJson(json);
  Map<String, dynamic> toJson() => _$ForwardMessageRequestToJson(this);
}

@JsonSerializable()
class LiveStreamResponse {
  final String streamKey;
  final String streamUrl;

  LiveStreamResponse({
    required this.streamKey,
    required this.streamUrl,
  });

  factory LiveStreamResponse.fromJson(Map<String, dynamic> json) => _$LiveStreamResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LiveStreamResponseToJson(this);
}

@JsonSerializable()
class UploadResponse {
  final String url;
  final String filename;
  final int size;

  UploadResponse({
    required this.url,
    required this.filename,
    required this.size,
  });

  factory UploadResponse.fromJson(Map<String, dynamic> json) => _$UploadResponseFromJson(json);
  Map<String, dynamic> toJson() => _$UploadResponseToJson(this);
}

@JsonSerializable()
class FcmTokenRequest {
  final String token;

  FcmTokenRequest({required this.token});

  factory FcmTokenRequest.fromJson(Map<String, dynamic> json) => _$FcmTokenRequestFromJson(json);
  Map<String, dynamic> toJson() => _$FcmTokenRequestToJson(this);
}

@JsonSerializable()
class HealthResponse {
  final String status;
  final String timestamp;
  final Map<String, dynamic> services;

  HealthResponse({
    required this.status,
    required this.timestamp,
    required this.services,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) => _$HealthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$HealthResponseToJson(this);
}

// Additional models
@JsonSerializable()
class FriendRequestModel {
  final String id;
  final UserModel user;
  final String status;
  final DateTime createdAt;

  FriendRequestModel({
    required this.id,
    required this.user,
    required this.status,
    required this.createdAt,
  });

  factory FriendRequestModel.fromJson(Map<String, dynamic> json) => _$FriendRequestModelFromJson(json);
  Map<String, dynamic> toJson() => _$FriendRequestModelToJson(this);
}

@JsonSerializable()
class StreakLeaderboardModel {
  final UserModel user;
  final int currentStreak;
  final int longestStreak;
  final int totalPoints;

  StreakLeaderboardModel({
    required this.user,
    required this.currentStreak,
    required this.longestStreak,
    required this.totalPoints,
  });

  factory StreakLeaderboardModel.fromJson(Map<String, dynamic> json) => _$StreakLeaderboardModelFromJson(json);
  Map<String, dynamic> toJson() => _$StreakLeaderboardModelToJson(this);
}

@JsonSerializable()
class AdminDashboardModel {
  final int totalUsers;
  final int activeUsers;
  final int totalStories;
  final int totalMessages;
  final double revenue;
  final List<ChartData> userGrowth;
  final List<ChartData> activityData;

  AdminDashboardModel({
    required this.totalUsers,
    required this.activeUsers,
    required this.totalStories,
    required this.totalMessages,
    required this.revenue,
    required this.userGrowth,
    required this.activityData,
  });

  factory AdminDashboardModel.fromJson(Map<String, dynamic> json) => _$AdminDashboardModelFromJson(json);
  Map<String, dynamic> toJson() => _$AdminDashboardModelToJson(this);
}

@JsonSerializable()
class ChartData {
  final String label;
  final double value;

  ChartData({
    required this.label,
    required this.value,
  });

  factory ChartData.fromJson(Map<String, dynamic> json) => _$ChartDataFromJson(json);
  Map<String, dynamic> toJson() => _$ChartDataToJson(this);
}

@JsonSerializable()
class AnnouncementRequest {
  final String title;
  final String message;
  final String type;

  AnnouncementRequest({
    required this.title,
    required this.message,
    required this.type,
  });

  factory AnnouncementRequest.fromJson(Map<String, dynamic> json) => _$AnnouncementRequestFromJson(json);
  Map<String, dynamic> toJson() => _$AnnouncementRequestToJson(this);
}

@JsonSerializable()
class UpdateUserStatusRequest {
  final String status;

  UpdateUserStatusRequest({required this.status});

  factory UpdateUserStatusRequest.fromJson(Map<String, dynamic> json) => _$UpdateUserStatusRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateUserStatusRequestToJson(this);
}