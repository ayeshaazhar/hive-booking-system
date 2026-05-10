# Hive Booking System - Workspace & Resource Management System

## Group Members
1. Ayesha Azhar
2. ____________________
3. ____________________

**Submission Date:** 08-May-2026

## 1. Executive Summary

### Overview
This project presents the development of the **Hive Booking System**, a web-based workspace and resource management platform developed using **Next.js**, **Prisma ORM**, and **PostgreSQL**. The system is designed to simplify booking management for organizations by allowing users to reserve meeting rooms and shared resources efficiently.

The platform supports organization management, user authentication, booking tracking, resource availability management, amenities management, notifications, and audit logging. The project demonstrates practical implementation of database management concepts, relational schema design, normalization, and modern web application architecture.

### Key Findings
- Relational database design using PostgreSQL
- ORM implementation using Prisma
- Multi-organization support
- Booking and scheduling management
- Resource and amenity management
- Notification system implementation
- Audit logging for tracking booking activities
- Database normalization and relationship handling

## 2. Introduction

### Background
Managing workspace reservations manually can lead to scheduling conflicts, poor resource utilization, and inefficient communication between users and administrators. Modern organizations require a centralized digital platform to manage meeting rooms, shared spaces, and workplace resources.

The Hive Booking System was developed to address these issues by providing a scalable, database-driven booking platform. The project combines frontend technologies with a relational database system to ensure efficient booking operations and data consistency.

### Project Objectives
- Develop a centralized booking management system
- Design a normalized relational database
- Implement resource and booking management
- Support multiple organizations
- Maintain booking history using audit logs
- Provide notifications to users
- Ensure data integrity using foreign key relationships

## 3. Project Description

### Scope
The project includes the following functionalities.

### Included Features
- User registration and management
- Organization management
- Meeting room and resource booking
- Booking approval and status management
- Amenities management
- Notification system
- Audit logging
- Role-based user access
- Booking history tracking

### Excluded Features
- Online payment integration
- Video conferencing integration
- AI-based recommendations
- Mobile application support
- Voice assistant integration

### Technical Overview
| Tool / Technology | Purpose |
|---|---|
| Next.js | Frontend and backend framework |
| PostgreSQL | Relational database |
| Prisma ORM | Database ORM and schema management |
| TypeScript | Type-safe development |
| Tailwind CSS | Frontend styling |
| Vercel | Deployment platform |

## 4. Methodology

### Approach
The project was developed in multiple stages, starting from database schema design to frontend implementation and testing. Prisma ORM was used to define models and relationships between tables. After database implementation, APIs and frontend interfaces were developed for user interaction.

1. Requirement analysis  
2. Database schema design  
3. Prisma model creation  
4. Relationship implementation  
5. Frontend dashboard development  
6. Booking system integration  
7. Notification implementation  
8. Testing and debugging

## 5. Database Design and Implementation

### Main Database Tables
| Table | Purpose |
|---|---|
| User | Stores user details and roles |
| Organization | Stores organization information |
| Resource | Stores meeting rooms and resources |
| Booking | Stores booking records |
| Amenity | Stores available amenities |
| ResourceAmenity | Manages many-to-many relationships |
| Notification | Stores user notifications |
| BookingAuditLog | Tracks booking activity history |

### Relationships Implemented
- One Organization can have many Users
- One Organization can have many Resources
- One User can create many Bookings
- One Resource can have many Bookings
- Many Resources can have many Amenities
- One Booking can contain multiple Audit Logs
- One User can receive multiple Notifications

### Normalization
The database schema follows normalization principles to reduce redundancy and improve data consistency. Junction tables such as `ResourceAmenity` are used for many-to-many relationships. Primary keys and foreign keys ensure referential integrity.

## 6. Challenges Faced

### Relationship Management
Managing multiple foreign key relationships between users, organizations, bookings, and resources was challenging.

### Many-to-Many Relations
Implementing amenities for multiple resources required a junction table approach.

### Audit Logging
Tracking booking changes efficiently required JSON snapshot support.

### Database Consistency
Maintaining data integrity during booking creation and deletion required proper relations and constraints.

## 7. Results

### Project Outcomes
- Successful implementation of relational database schema
- Efficient booking and scheduling management
- Accurate relationship handling between entities
- Role-based access control support
- Scalable and maintainable database structure
- Improved understanding of Prisma and PostgreSQL

### Testing and Validation
| Test Case | Expected Result | Status |
|---|---|---|
| User Registration | User added successfully | Passed |
| Booking Creation | Booking stored in database | Passed |
| Notification Creation | Notification generated | Passed |
| Resource Assignment | Resource linked correctly | Passed |
| Audit Logging | Booking actions recorded | Passed |
| Duplicate Email Check | Validation error shown | Passed |

## 8. Conclusion

### Summary of Findings
The Hive Booking System successfully implements a scalable relational database system for managing workspace bookings and organizational resources. The project demonstrates database normalization, relationship handling, audit logging, and modern ORM integration using Prisma and PostgreSQL.

### Final Remarks
Future improvements can further enhance the system by including:
- Mobile application support
- AI-powered room recommendations
- Advanced analytics dashboard
- Calendar synchronization
- Real-time booking updates
