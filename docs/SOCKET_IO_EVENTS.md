# Socket.IO Events Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Messages](#messages)
3. [Notifications](#notifications)
4. [Application Updates](#application-updates)
5. [User Status](#user-status)
6. [System Announcements](#system-announcements)
7. [Error Handling](#error-handling)

## Authentication

### Connection
- **Event**: `connect`
  - **Direction**: Server → Client
  - **Payload**: None
  - **Description**: Emitted when the client successfully connects to the server.

### Disconnection
- **Event**: `disconnect`
  - **Direction**: Server → Client
  - **Payload**: `{ reason: string }`
  - **Description**: Emitted when the client is disconnected from the server.

## Messages

### Send Message
- **Event**: `send_message`
  - **Direction**: Client → Server
  - **Payload**:
    ```typescript
    {
      recipientId: string | number,
      message: string,
      conversationId?: string | number,
      attachments?: Array<{
        url: string,
        type: 'image' | 'document' | 'other',
        name?: string,
        size?: number
      }>
    }
    ```
  - **Description**: Client sends a message to a recipient.

### Receive Message
- **Event**: `receive_message`
  - **Direction**: Server → Client
  - **Payload**:
    ```typescript
    {
      id: string | number,
      senderId: string | number,
      recipientId: string | number,
      message: string,
      timestamp: string (ISO date),
      status: 'sent' | 'delivered' | 'read',
      conversationId?: string | number,
      attachments?: Array<{
        url: string,
        type: 'image' | 'document' | 'other',
        name?: string,
        size?: number
      }>
    }
    ```
  - **Description**: Server broadcasts a message to the intended recipient.

### Message Status Update
- **Event**: `message_status`
  - **Direction**: Server → Client
  - **Payload**:
    ```typescript
    {
      messageId: string | number,
      status: 'delivered' | 'read',
      timestamp: string (ISO date)
    }
    ```
  - **Description**: Updates the status of a sent message.

## Notifications

### New Notification
- **Event**: `new_notification`
  - **Direction**: Server → Client
  - **Payload**:
    ```typescript
    {
      id: string | number,
      userId: string | number,
      type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'application_update',
      title: string,
      message: string,
      read: boolean,
      data?: Record<string, any>,
      createdAt: string (ISO date)
    }
    ```
  - **Description**: Server sends a new notification to a specific user.

### Mark Notification as Read
- **Event**: `mark_notification_read`
  - **Direction**: Client → Server
  - **Payload**: `{ notificationId: string | number }`
  - **Description**: Client notifies the server that a notification has been read.

## Application Updates

### Application Status Update
- **Event**: `application_update`
  - **Direction**: Server → Client
  - **Payload**:
    ```typescript
    {
      applicationId: string | number,
      internshipId: string | number,
      internshipTitle: string,
      status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn',
      updatedAt: string (ISO date),
      message?: string
    }
    ```
  - **Description**: Server notifies a user about an update to their application status.

## User Status

### User Online/Offline
- **Event**: `user_status_change`
  - **Direction**: Server → All Clients
  - **Payload**:
    ```typescript
    {
      userId: string | number,
      status: 'online' | 'offline' | 'away',
      lastSeen?: string (ISO date)
    }
    ```
  - **Description**: Broadcasts a user's status change to all connected clients.

## System Announcements

### System Announcement
- **Event**: `system_announcement`
  - **Direction**: Server → All Clients
  - **Payload**:
    ```typescript
    {
      id: string | number,
      type: 'maintenance' | 'update' | 'alert' | 'info',
      title: string,
      message: string,
      startTime?: string (ISO date),
      endTime?: string (ISO date),
      isCritical: boolean
    }
    ```
  - **Description**: Broadcasts a system-wide announcement to all connected clients.

## Error Handling

### Error
- **Event**: `error`
  - **Direction**: Server → Client
  - **Payload**:
    ```typescript
    {
      code: string,
      message: string,
      timestamp: string (ISO date),
      details?: any
    }
    ```
  - **Description**: Server sends error information to the client.

## Room Management

### Join Room
- **Event**: `join_room`
  - **Direction**: Client → Server
  - **Payload**: `{ roomId: string | number }`
  - **Description**: Client requests to join a specific room.

### Leave Room
- **Event**: `leave_room`
  - **Direction**: Client → Server
  - **Payload**: `{ roomId: string | number }`
  - **Description**: Client requests to leave a specific room.

### Room Update
- **Event**: `room_update`
  - **Direction**: Server → Room Clients
  - **Payload**:
    ```typescript
    {
      roomId: string | number,
      type: 'user_joined' | 'user_left' | 'settings_updated',
      userId?: string | number,
      userCount: number,
      timestamp: string (ISO date)
    }
    ```
  - **Description**: Server notifies clients in a room about room updates.
