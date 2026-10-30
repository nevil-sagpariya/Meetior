'use strict';

const sequelize = require('../config/database');

// Import all models
const User              = require('./User');
const Category          = require('./Category');
const Location          = require('./Location');
const Event             = require('./Event');
const EventImage        = require('./EventImage');
const EventInteraction  = require('./EventInteraction');
const EventRegistration = require('./EventRegistration');
const Payment           = require('./Payment');
const EventTicket       = require('./EventTicket');
const EventCheckIn      = require('./EventCheckIn');
const SecondChanceRequest  = require('./SecondChanceRequest');
const SecondChanceResponse = require('./SecondChanceResponse');
const EventDemand       = require('./EventDemand');
const DemandSupporter   = require('./DemandSupporter');
const DemandResponse    = require('./DemandResponse');
const Notification      = require('./Notification');
const NotificationDelivery = require('./NotificationDelivery');
const EventReview       = require('./EventReview');
const State             = require('./State');
const District          = require('./District');
const City              = require('./City');
const PostalCode        = require('./PostalCode');
const Report            = require('./Report');
const EventModeration   = require('./EventModeration');
const AdminAuditLog     = require('./AdminAuditLog');
const PlatformSetting   = require('./PlatformSetting');
const AdminRolePermission = require('./AdminRolePermission');

// ──────────────────────────────────────────
// ASSOCIATIONS
// ──────────────────────────────────────────

// Administrative Geography Associations
State.hasMany(District,       { foreignKey: 'state_id', as: 'districts' });
District.belongsTo(State,     { foreignKey: 'state_id', as: 'state' });

District.hasMany(City,        { foreignKey: 'district_id', as: 'cities' });
City.belongsTo(District,      { foreignKey: 'district_id', as: 'district' });

State.hasMany(PostalCode,     { foreignKey: 'state_id', as: 'postal_codes' });
PostalCode.belongsTo(State,   { foreignKey: 'state_id', as: 'state' });

District.hasMany(PostalCode,  { foreignKey: 'district_id', as: 'postal_codes' });
PostalCode.belongsTo(District,{ foreignKey: 'district_id', as: 'district' });

City.hasMany(PostalCode,      { foreignKey: 'city_id', as: 'postal_codes' });
PostalCode.belongsTo(City,    { foreignKey: 'city_id', as: 'city' });

// User – Events (organizer)
User.hasMany(Event,    { foreignKey: 'organizer_id', as: 'organized_events' });
Event.belongsTo(User,  { foreignKey: 'organizer_id', as: 'organizer' });

// Category – Events
Category.hasMany(Event,   { foreignKey: 'category_id', as: 'events' });
Event.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Location – Events
Location.hasMany(Event,   { foreignKey: 'location_id', as: 'events' });
Event.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

// Event – repeated sessions (self-reference)
Event.belongsTo(Event, { foreignKey: 'original_event_id', as: 'original_event' });
Event.hasMany(Event,   { foreignKey: 'original_event_id', as: 'sessions' });

// Event – EventImages
Event.hasMany(EventImage,       { foreignKey: 'event_id', as: 'images' });
EventImage.belongsTo(Event,     { foreignKey: 'event_id' });

// EventInteractions
User.hasMany(EventInteraction,           { foreignKey: 'user_id', as: 'interactions' });
EventInteraction.belongsTo(User,         { foreignKey: 'user_id' });
Event.hasMany(EventInteraction,          { foreignKey: 'event_id', as: 'interactions' });
EventInteraction.belongsTo(Event,        { foreignKey: 'event_id' });

// EventRegistrations
User.hasMany(EventRegistration,          { foreignKey: 'user_id', as: 'registrations' });
EventRegistration.belongsTo(User,        { foreignKey: 'user_id', as: 'user' });
Event.hasMany(EventRegistration,         { foreignKey: 'event_id', as: 'registrations' });
EventRegistration.belongsTo(Event,       { foreignKey: 'event_id', as: 'event' });

// Payments
EventRegistration.hasOne(Payment,        { foreignKey: 'registration_id', as: 'payment' });
Payment.belongsTo(EventRegistration,     { foreignKey: 'registration_id', as: 'registration' });

// EventTickets
EventRegistration.hasOne(EventTicket,    { foreignKey: 'registration_id', as: 'ticket' });
EventTicket.belongsTo(EventRegistration, { foreignKey: 'registration_id', as: 'registration' });

// EventCheckIns
EventTicket.hasOne(EventCheckIn,         { foreignKey: 'ticket_id', as: 'checkin' });
EventCheckIn.belongsTo(EventTicket,      { foreignKey: 'ticket_id', as: 'ticket' });
Event.hasMany(EventCheckIn,              { foreignKey: 'event_id', as: 'checkins' });
EventCheckIn.belongsTo(Event,            { foreignKey: 'event_id', as: 'event' });
User.hasMany(EventCheckIn,               { foreignKey: 'checked_in_by', as: 'performed_checkins' });
EventCheckIn.belongsTo(User,             { foreignKey: 'checked_in_by', as: 'scanner' });

// SecondChance
Event.hasMany(SecondChanceRequest,       { foreignKey: 'original_event_id', as: 'second_chance_requests' });
SecondChanceRequest.belongsTo(Event,     { foreignKey: 'original_event_id', as: 'original_event' });
User.hasMany(SecondChanceRequest,        { foreignKey: 'user_id', as: 'second_chance_requests' });
SecondChanceRequest.belongsTo(User,      { foreignKey: 'user_id', as: 'user' });

Event.hasOne(SecondChanceResponse,       { foreignKey: 'original_event_id', as: 'second_chance_response' });
SecondChanceResponse.belongsTo(Event,    { foreignKey: 'original_event_id', as: 'original_event' });
User.hasMany(SecondChanceResponse,       { foreignKey: 'organizer_id', as: 'second_chance_responses' });
SecondChanceResponse.belongsTo(User,     { foreignKey: 'organizer_id', as: 'organizer' });
SecondChanceResponse.belongsTo(Event,    { foreignKey: 'new_session_event_id', as: 'new_session' });

// EventDemands
User.hasMany(EventDemand,                { foreignKey: 'created_by', as: 'demands' });
EventDemand.belongsTo(User,              { foreignKey: 'created_by', as: 'creator' });
Category.hasMany(EventDemand,            { foreignKey: 'category_id', as: 'demands' });
EventDemand.belongsTo(Category,          { foreignKey: 'category_id', as: 'category' });
Event.hasMany(EventDemand,               { foreignKey: 'linked_event_id', as: 'demand_fulfillments' });
EventDemand.belongsTo(Event,             { foreignKey: 'linked_event_id', as: 'linked_event' });

// DemandSupporters
EventDemand.hasMany(DemandSupporter,     { foreignKey: 'demand_id', as: 'supporters' });
DemandSupporter.belongsTo(EventDemand,   { foreignKey: 'demand_id' });
User.hasMany(DemandSupporter,            { foreignKey: 'user_id', as: 'demand_supports' });
DemandSupporter.belongsTo(User,          { foreignKey: 'user_id', as: 'user' });

// DemandResponses
EventDemand.hasMany(DemandResponse,      { foreignKey: 'demand_id', as: 'responses' });
DemandResponse.belongsTo(EventDemand,    { foreignKey: 'demand_id' });
User.hasMany(DemandResponse,             { foreignKey: 'organizer_id', as: 'demand_responses' });
DemandResponse.belongsTo(User,           { foreignKey: 'organizer_id', as: 'organizer' });
Event.hasMany(DemandResponse,            { foreignKey: 'linked_event_id', as: 'demand_responses' });
DemandResponse.belongsTo(Event,          { foreignKey: 'linked_event_id', as: 'linked_event' });

// Notifications
User.hasMany(Notification,               { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User,             { foreignKey: 'user_id' });
Event.hasMany(Notification,              { foreignKey: 'related_event_id', as: 'notifications' });
Notification.belongsTo(Event,            { foreignKey: 'related_event_id', as: 'event' });

// NotificationDeliveries
User.hasMany(NotificationDelivery,       { foreignKey: 'user_id', as: 'notification_deliveries' });
NotificationDelivery.belongsTo(User,     { foreignKey: 'user_id' });
Event.hasMany(NotificationDelivery,      { foreignKey: 'event_id', as: 'notification_deliveries' });
NotificationDelivery.belongsTo(Event,    { foreignKey: 'event_id' });

// EventReviews
Event.hasMany(EventReview,               { foreignKey: 'event_id', as: 'reviews' });
EventReview.belongsTo(Event,             { foreignKey: 'event_id', as: 'event' });
User.hasMany(EventReview,                { foreignKey: 'user_id', as: 'reviews' });
EventReview.belongsTo(User,              { foreignKey: 'user_id', as: 'reviewer' });

// Reports
User.hasMany(Report,                     { foreignKey: 'reporter_id', as: 'submitted_reports' });
Report.belongsTo(User,                   { foreignKey: 'reporter_id', as: 'reporter' });
Report.belongsTo(User,                   { foreignKey: 'reviewed_by', as: 'reviewer_admin' });

// Event Moderation & Admin Audit Logs
Event.hasMany(EventModeration,           { foreignKey: 'event_id', as: 'moderation_actions' });
EventModeration.belongsTo(Event,         { foreignKey: 'event_id', as: 'event' });
EventModeration.belongsTo(User,          { foreignKey: 'admin_id', as: 'admin' });
User.hasMany(AdminAuditLog,              { foreignKey: 'admin_id', as: 'admin_audit_logs' });
AdminAuditLog.belongsTo(User,            { foreignKey: 'admin_id', as: 'admin' });

// Platform Settings & Admin Permissions
PlatformSetting.belongsTo(User,          { foreignKey: 'updated_by', as: 'updater' });

module.exports = {
  sequelize,
  User,
  Category,
  Location,
  Event,
  EventImage,
  EventInteraction,
  EventRegistration,
  Payment,
  EventTicket,
  EventCheckIn,
  SecondChanceRequest,
  SecondChanceResponse,
  EventDemand,
  DemandSupporter,
  DemandResponse,
  Notification,
  NotificationDelivery,
  EventReview,
  State,
  District,
  City,
  PostalCode,
  Report,
  EventModeration,
  AdminAuditLog,
  PlatformSetting,
  AdminRolePermission,
};
