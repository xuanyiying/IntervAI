"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paddle = void 0;
const client_js_1 = require("./internal/api/client.js");
const index_js_1 = require("./internal/index.js");
const index_js_2 = require("./resources/index.js");
const index_js_3 = require("./resources/events/index.js");
const index_js_4 = require("./notifications/index.js");
class Paddle {
    client;
    defaultPaddleOptions = {
        environment: index_js_1.Environment.production,
        logLevel: index_js_1.LogLevel.error,
    };
    products;
    prices;
    transactions;
    adjustments;
    customers;
    customerPortalSessions;
    addresses;
    businesses;
    discounts;
    discountGroups;
    subscriptions;
    paymentMethods;
    pricingPreview;
    events;
    webhooks;
    eventTypes;
    notificationSettings;
    notifications;
    reports;
    simulationTypes;
    simulations;
    simulationRuns;
    simulationRunEvents;
    clientTokens;
    constructor(apiKey, options) {
        this.client = new client_js_1.Client(apiKey, options ? { ...this.defaultPaddleOptions, ...options } : { ...this.defaultPaddleOptions });
        this.products = new index_js_2.ProductsResource(this.client);
        this.prices = new index_js_2.PricesResource(this.client);
        this.transactions = new index_js_2.TransactionsResource(this.client);
        this.adjustments = new index_js_2.AdjustmentsResource(this.client);
        this.customers = new index_js_2.CustomersResource(this.client);
        this.customerPortalSessions = new index_js_2.CustomerPortalSessionsResource(this.client);
        this.addresses = new index_js_2.AddressesResource(this.client);
        this.businesses = new index_js_2.BusinessesResource(this.client);
        this.discounts = new index_js_2.DiscountsResource(this.client);
        this.discountGroups = new index_js_2.DiscountGroupsResource(this.client);
        this.subscriptions = new index_js_2.SubscriptionsResource(this.client);
        this.paymentMethods = new index_js_2.PaymentMethodsResource(this.client);
        this.pricingPreview = new index_js_2.PricingPreviewResource(this.client);
        this.events = new index_js_3.EventsResource(this.client);
        this.webhooks = new index_js_4.Webhooks();
        this.eventTypes = new index_js_2.EventTypesResource(this.client);
        this.notificationSettings = new index_js_2.NotificationSettingsResource(this.client);
        this.notifications = new index_js_2.NotificationsResource(this.client);
        this.reports = new index_js_2.ReportsResource(this.client);
        this.simulationTypes = new index_js_2.SimulationTypesResource(this.client);
        this.simulations = new index_js_2.SimulationsResource(this.client);
        this.simulationRuns = new index_js_2.SimulationRunsResource(this.client);
        this.simulationRunEvents = new index_js_2.SimulationRunEventsResource(this.client);
        this.clientTokens = new index_js_2.ClientTokensResource(this.client);
    }
}
exports.Paddle = Paddle;
