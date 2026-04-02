'use strict';

var middlewareHostHeader = require('@aws-sdk/middleware-host-header');
var middlewareLogger = require('@aws-sdk/middleware-logger');
var middlewareRecursionDetection = require('@aws-sdk/middleware-recursion-detection');
var middlewareUserAgent = require('@aws-sdk/middleware-user-agent');
var configResolver = require('@smithy/config-resolver');
var core = require('@smithy/core');
var schema = require('@smithy/core/schema');
var middlewareContentLength = require('@smithy/middleware-content-length');
var middlewareEndpoint = require('@smithy/middleware-endpoint');
var middlewareRetry = require('@smithy/middleware-retry');
var smithyClient = require('@smithy/smithy-client');
var httpAuthSchemeProvider = require('./auth/httpAuthSchemeProvider');
var runtimeConfig = require('./runtimeConfig');
var regionConfigResolver = require('@aws-sdk/region-config-resolver');
var protocolHttp = require('@smithy/protocol-http');
var utilWaiter = require('@smithy/util-waiter');

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "ses",
    });
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};

const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign(regionConfigResolver.getAwsRegionExtensionConfiguration(runtimeConfig), smithyClient.getDefaultExtensionConfiguration(runtimeConfig), protocolHttp.getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, regionConfigResolver.resolveAwsRegionExtensionConfiguration(extensionConfiguration), smithyClient.resolveDefaultRuntimeConfig(extensionConfiguration), protocolHttp.resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

class SESClient extends smithyClient.Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = runtimeConfig.getRuntimeConfig(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = middlewareUserAgent.resolveUserAgentConfig(_config_1);
        const _config_3 = middlewareRetry.resolveRetryConfig(_config_2);
        const _config_4 = configResolver.resolveRegionConfig(_config_3);
        const _config_5 = middlewareHostHeader.resolveHostHeaderConfig(_config_4);
        const _config_6 = middlewareEndpoint.resolveEndpointConfig(_config_5);
        const _config_7 = httpAuthSchemeProvider.resolveHttpAuthSchemeConfig(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
        this.config = _config_8;
        this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(middlewareUserAgent.getUserAgentPlugin(this.config));
        this.middlewareStack.use(middlewareRetry.getRetryPlugin(this.config));
        this.middlewareStack.use(middlewareContentLength.getContentLengthPlugin(this.config));
        this.middlewareStack.use(middlewareHostHeader.getHostHeaderPlugin(this.config));
        this.middlewareStack.use(middlewareLogger.getLoggerPlugin(this.config));
        this.middlewareStack.use(middlewareRecursionDetection.getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: httpAuthSchemeProvider.defaultSESHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}

let SESServiceException$1 = class SESServiceException extends smithyClient.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SESServiceException.prototype);
    }
};

let AccountSendingPausedException$1 = class AccountSendingPausedException extends SESServiceException$1 {
    name = "AccountSendingPausedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "AccountSendingPausedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AccountSendingPausedException.prototype);
    }
};
let AlreadyExistsException$1 = class AlreadyExistsException extends SESServiceException$1 {
    name = "AlreadyExistsException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "AlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, AlreadyExistsException.prototype);
        this.Name = opts.Name;
    }
};
let CannotDeleteException$1 = class CannotDeleteException extends SESServiceException$1 {
    name = "CannotDeleteException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "CannotDeleteException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CannotDeleteException.prototype);
        this.Name = opts.Name;
    }
};
let LimitExceededException$1 = class LimitExceededException extends SESServiceException$1 {
    name = "LimitExceededException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "LimitExceededException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, LimitExceededException.prototype);
    }
};
let RuleSetDoesNotExistException$1 = class RuleSetDoesNotExistException extends SESServiceException$1 {
    name = "RuleSetDoesNotExistException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "RuleSetDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RuleSetDoesNotExistException.prototype);
        this.Name = opts.Name;
    }
};
let ConfigurationSetAlreadyExistsException$1 = class ConfigurationSetAlreadyExistsException extends SESServiceException$1 {
    name = "ConfigurationSetAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
};
let ConfigurationSetDoesNotExistException$1 = class ConfigurationSetDoesNotExistException extends SESServiceException$1 {
    name = "ConfigurationSetDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
};
let ConfigurationSetSendingPausedException$1 = class ConfigurationSetSendingPausedException extends SESServiceException$1 {
    name = "ConfigurationSetSendingPausedException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "ConfigurationSetSendingPausedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ConfigurationSetSendingPausedException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
};
let InvalidConfigurationSetException$1 = class InvalidConfigurationSetException extends SESServiceException$1 {
    name = "InvalidConfigurationSetException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidConfigurationSetException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidConfigurationSetException.prototype);
    }
};
let EventDestinationAlreadyExistsException$1 = class EventDestinationAlreadyExistsException extends SESServiceException$1 {
    name = "EventDestinationAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "EventDestinationAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EventDestinationAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
};
let InvalidCloudWatchDestinationException$1 = class InvalidCloudWatchDestinationException extends SESServiceException$1 {
    name = "InvalidCloudWatchDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidCloudWatchDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidCloudWatchDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
};
let InvalidFirehoseDestinationException$1 = class InvalidFirehoseDestinationException extends SESServiceException$1 {
    name = "InvalidFirehoseDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidFirehoseDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidFirehoseDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
};
let InvalidSNSDestinationException$1 = class InvalidSNSDestinationException extends SESServiceException$1 {
    name = "InvalidSNSDestinationException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "InvalidSNSDestinationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSNSDestinationException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
};
let InvalidTrackingOptionsException$1 = class InvalidTrackingOptionsException extends SESServiceException$1 {
    name = "InvalidTrackingOptionsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidTrackingOptionsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidTrackingOptionsException.prototype);
    }
};
let TrackingOptionsAlreadyExistsException$1 = class TrackingOptionsAlreadyExistsException extends SESServiceException$1 {
    name = "TrackingOptionsAlreadyExistsException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "TrackingOptionsAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TrackingOptionsAlreadyExistsException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
};
let CustomVerificationEmailInvalidContentException$1 = class CustomVerificationEmailInvalidContentException extends SESServiceException$1 {
    name = "CustomVerificationEmailInvalidContentException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "CustomVerificationEmailInvalidContentException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailInvalidContentException.prototype);
    }
};
let CustomVerificationEmailTemplateAlreadyExistsException$1 = class CustomVerificationEmailTemplateAlreadyExistsException extends SESServiceException$1 {
    name = "CustomVerificationEmailTemplateAlreadyExistsException";
    $fault = "client";
    CustomVerificationEmailTemplateName;
    constructor(opts) {
        super({
            name: "CustomVerificationEmailTemplateAlreadyExistsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailTemplateAlreadyExistsException.prototype);
        this.CustomVerificationEmailTemplateName = opts.CustomVerificationEmailTemplateName;
    }
};
let FromEmailAddressNotVerifiedException$1 = class FromEmailAddressNotVerifiedException extends SESServiceException$1 {
    name = "FromEmailAddressNotVerifiedException";
    $fault = "client";
    FromEmailAddress;
    constructor(opts) {
        super({
            name: "FromEmailAddressNotVerifiedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, FromEmailAddressNotVerifiedException.prototype);
        this.FromEmailAddress = opts.FromEmailAddress;
    }
};
let InvalidLambdaFunctionException$1 = class InvalidLambdaFunctionException extends SESServiceException$1 {
    name = "InvalidLambdaFunctionException";
    $fault = "client";
    FunctionArn;
    constructor(opts) {
        super({
            name: "InvalidLambdaFunctionException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidLambdaFunctionException.prototype);
        this.FunctionArn = opts.FunctionArn;
    }
};
let InvalidS3ConfigurationException$1 = class InvalidS3ConfigurationException extends SESServiceException$1 {
    name = "InvalidS3ConfigurationException";
    $fault = "client";
    Bucket;
    constructor(opts) {
        super({
            name: "InvalidS3ConfigurationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidS3ConfigurationException.prototype);
        this.Bucket = opts.Bucket;
    }
};
let InvalidSnsTopicException$1 = class InvalidSnsTopicException extends SESServiceException$1 {
    name = "InvalidSnsTopicException";
    $fault = "client";
    Topic;
    constructor(opts) {
        super({
            name: "InvalidSnsTopicException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidSnsTopicException.prototype);
        this.Topic = opts.Topic;
    }
};
let RuleDoesNotExistException$1 = class RuleDoesNotExistException extends SESServiceException$1 {
    name = "RuleDoesNotExistException";
    $fault = "client";
    Name;
    constructor(opts) {
        super({
            name: "RuleDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, RuleDoesNotExistException.prototype);
        this.Name = opts.Name;
    }
};
let InvalidTemplateException$1 = class InvalidTemplateException extends SESServiceException$1 {
    name = "InvalidTemplateException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "InvalidTemplateException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidTemplateException.prototype);
        this.TemplateName = opts.TemplateName;
    }
};
let CustomVerificationEmailTemplateDoesNotExistException$1 = class CustomVerificationEmailTemplateDoesNotExistException extends SESServiceException$1 {
    name = "CustomVerificationEmailTemplateDoesNotExistException";
    $fault = "client";
    CustomVerificationEmailTemplateName;
    constructor(opts) {
        super({
            name: "CustomVerificationEmailTemplateDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, CustomVerificationEmailTemplateDoesNotExistException.prototype);
        this.CustomVerificationEmailTemplateName = opts.CustomVerificationEmailTemplateName;
    }
};
let EventDestinationDoesNotExistException$1 = class EventDestinationDoesNotExistException extends SESServiceException$1 {
    name = "EventDestinationDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    EventDestinationName;
    constructor(opts) {
        super({
            name: "EventDestinationDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, EventDestinationDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
        this.EventDestinationName = opts.EventDestinationName;
    }
};
let TrackingOptionsDoesNotExistException$1 = class TrackingOptionsDoesNotExistException extends SESServiceException$1 {
    name = "TrackingOptionsDoesNotExistException";
    $fault = "client";
    ConfigurationSetName;
    constructor(opts) {
        super({
            name: "TrackingOptionsDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TrackingOptionsDoesNotExistException.prototype);
        this.ConfigurationSetName = opts.ConfigurationSetName;
    }
};
let TemplateDoesNotExistException$1 = class TemplateDoesNotExistException extends SESServiceException$1 {
    name = "TemplateDoesNotExistException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "TemplateDoesNotExistException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TemplateDoesNotExistException.prototype);
        this.TemplateName = opts.TemplateName;
    }
};
let InvalidDeliveryOptionsException$1 = class InvalidDeliveryOptionsException extends SESServiceException$1 {
    name = "InvalidDeliveryOptionsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidDeliveryOptionsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidDeliveryOptionsException.prototype);
    }
};
let InvalidPolicyException$1 = class InvalidPolicyException extends SESServiceException$1 {
    name = "InvalidPolicyException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidPolicyException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidPolicyException.prototype);
    }
};
let InvalidRenderingParameterException$1 = class InvalidRenderingParameterException extends SESServiceException$1 {
    name = "InvalidRenderingParameterException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "InvalidRenderingParameterException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidRenderingParameterException.prototype);
        this.TemplateName = opts.TemplateName;
    }
};
let MailFromDomainNotVerifiedException$1 = class MailFromDomainNotVerifiedException extends SESServiceException$1 {
    name = "MailFromDomainNotVerifiedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MailFromDomainNotVerifiedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MailFromDomainNotVerifiedException.prototype);
    }
};
let MessageRejected$1 = class MessageRejected extends SESServiceException$1 {
    name = "MessageRejected";
    $fault = "client";
    constructor(opts) {
        super({
            name: "MessageRejected",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MessageRejected.prototype);
    }
};
let MissingRenderingAttributeException$1 = class MissingRenderingAttributeException extends SESServiceException$1 {
    name = "MissingRenderingAttributeException";
    $fault = "client";
    TemplateName;
    constructor(opts) {
        super({
            name: "MissingRenderingAttributeException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, MissingRenderingAttributeException.prototype);
        this.TemplateName = opts.TemplateName;
    }
};
let ProductionAccessNotGrantedException$1 = class ProductionAccessNotGrantedException extends SESServiceException$1 {
    name = "ProductionAccessNotGrantedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ProductionAccessNotGrantedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ProductionAccessNotGrantedException.prototype);
    }
};

const _A = "After";
const _AD = "ArrivalDate";
const _AEE = "AlreadyExistsException";
const _AHA = "AddHeaderAction";
const _ASPE = "AccountSendingPausedException";
const _Ac = "Actions";
const _Act = "Action";
const _B = "Body";
const _BA = "BounceAction";
const _BAc = "BccAddresses";
const _BED = "BulkEmailDestination";
const _BEDL = "BulkEmailDestinationList";
const _BEDS = "BulkEmailDestinationStatus";
const _BEDSL = "BulkEmailDestinationStatusList";
const _BN = "BucketName";
const _BOMXF = "BehaviorOnMXFailure";
const _BRI = "BouncedRecipientInfo";
const _BRIL = "BouncedRecipientInfoList";
const _BS = "BounceSender";
const _BSA = "BounceSenderArn";
const _BT = "BounceType";
const _BTo = "BounceTopic";
const _Bo = "Bounces";
const _Bu = "Bucket";
const _C = "Content";
const _CA = "ConnectAction";
const _CAc = "CcAddresses";
const _CCS = "CreateConfigurationSet";
const _CCSED = "CreateConfigurationSetEventDestination";
const _CCSEDR = "CreateConfigurationSetEventDestinationRequest";
const _CCSEDRr = "CreateConfigurationSetEventDestinationResponse";
const _CCSR = "CreateConfigurationSetRequest";
const _CCSRr = "CreateConfigurationSetResponse";
const _CCSTO = "CreateConfigurationSetTrackingOptions";
const _CCSTOR = "CreateConfigurationSetTrackingOptionsRequest";
const _CCSTORr = "CreateConfigurationSetTrackingOptionsResponse";
const _CCVET = "CreateCustomVerificationEmailTemplate";
const _CCVETR = "CreateCustomVerificationEmailTemplateRequest";
const _CDE = "CannotDeleteException";
const _CRD = "CustomRedirectDomain";
const _CRF = "CreateReceiptFilter";
const _CRFR = "CreateReceiptFilterRequest";
const _CRFRr = "CreateReceiptFilterResponse";
const _CRR = "CreateReceiptRule";
const _CRRR = "CreateReceiptRuleRequest";
const _CRRRr = "CreateReceiptRuleResponse";
const _CRRS = "CloneReceiptRuleSet";
const _CRRSR = "CloneReceiptRuleSetRequest";
const _CRRSRl = "CloneReceiptRuleSetResponse";
const _CRRSRr = "CreateReceiptRuleSetRequest";
const _CRRSRre = "CreateReceiptRuleSetResponse";
const _CRRSr = "CreateReceiptRuleSet";
const _CS = "ConfigurationSet";
const _CSAEE = "ConfigurationSetAlreadyExistsException";
const _CSAN = "ConfigurationSetAttributeNames";
const _CSDNEE = "ConfigurationSetDoesNotExistException";
const _CSN = "ConfigurationSetName";
const _CSSPE = "ConfigurationSetSendingPausedException";
const _CSo = "ConfigurationSets";
const _CT = "ComplaintTopic";
const _CTR = "CreateTemplateRequest";
const _CTRr = "CreateTemplateResponse";
const _CTr = "CreatedTimestamp";
const _CTre = "CreateTemplate";
const _CVEICE = "CustomVerificationEmailInvalidContentException";
const _CVET = "CustomVerificationEmailTemplate";
const _CVETAEE = "CustomVerificationEmailTemplateAlreadyExistsException";
const _CVETDNEE = "CustomVerificationEmailTemplateDoesNotExistException";
const _CVETN = "CustomVerificationEmailTemplateName";
const _CVETu = "CustomVerificationEmailTemplates";
const _CWD = "CloudWatchDestination";
const _CWDC = "CloudWatchDimensionConfiguration";
const _CWDCl = "CloudWatchDimensionConfigurations";
const _Ch = "Charset";
const _Ci = "Cidr";
const _Co = "Complaints";
const _D = "Destination";
const _DA = "DkimAttributes";
const _DARRS = "DescribeActiveReceiptRuleSet";
const _DARRSR = "DescribeActiveReceiptRuleSetRequest";
const _DARRSRe = "DescribeActiveReceiptRuleSetResponse";
const _DAe = "DeliveryAttempts";
const _DC = "DimensionConfigurations";
const _DCS = "DeleteConfigurationSet";
const _DCSED = "DeleteConfigurationSetEventDestination";
const _DCSEDR = "DeleteConfigurationSetEventDestinationRequest";
const _DCSEDRe = "DeleteConfigurationSetEventDestinationResponse";
const _DCSR = "DeleteConfigurationSetRequest";
const _DCSRe = "DeleteConfigurationSetResponse";
const _DCSRes = "DescribeConfigurationSetRequest";
const _DCSResc = "DescribeConfigurationSetResponse";
const _DCSTO = "DeleteConfigurationSetTrackingOptions";
const _DCSTOR = "DeleteConfigurationSetTrackingOptionsRequest";
const _DCSTORe = "DeleteConfigurationSetTrackingOptionsResponse";
const _DCSe = "DescribeConfigurationSet";
const _DCVET = "DeleteCustomVerificationEmailTemplate";
const _DCVETR = "DeleteCustomVerificationEmailTemplateRequest";
const _DCi = "DiagnosticCode";
const _DDV = "DefaultDimensionValue";
const _DE = "DkimEnabled";
const _DI = "DeleteIdentity";
const _DIP = "DeleteIdentityPolicy";
const _DIPR = "DeleteIdentityPolicyRequest";
const _DIPRe = "DeleteIdentityPolicyResponse";
const _DIR = "DeleteIdentityRequest";
const _DIRe = "DeleteIdentityResponse";
const _DN = "DimensionName";
const _DO = "DeliveryOptions";
const _DRF = "DeleteReceiptFilter";
const _DRFR = "DeleteReceiptFilterRequest";
const _DRFRe = "DeleteReceiptFilterResponse";
const _DRR = "DeleteReceiptRule";
const _DRRR = "DeleteReceiptRuleRequest";
const _DRRRe = "DeleteReceiptRuleResponse";
const _DRRRes = "DescribeReceiptRuleRequest";
const _DRRResc = "DescribeReceiptRuleResponse";
const _DRRS = "DeleteReceiptRuleSet";
const _DRRSR = "DeleteReceiptRuleSetRequest";
const _DRRSRe = "DeleteReceiptRuleSetResponse";
const _DRRSRes = "DescribeReceiptRuleSetRequest";
const _DRRSResc = "DescribeReceiptRuleSetResponse";
const _DRRSe = "DescribeReceiptRuleSet";
const _DRRe = "DescribeReceiptRule";
const _DSARN = "DeliveryStreamARN";
const _DT = "DkimTokens";
const _DTD = "DefaultTemplateData";
const _DTR = "DeleteTemplateRequest";
const _DTRe = "DeleteTemplateResponse";
const _DTe = "DeliveryTopic";
const _DTef = "DefaultTags";
const _DTel = "DeleteTemplate";
const _DVEA = "DeleteVerifiedEmailAddress";
const _DVEAR = "DeleteVerifiedEmailAddressRequest";
const _DVS = "DimensionValueSource";
const _DVSk = "DkimVerificationStatus";
const _Da = "Data";
const _De = "Destinations";
const _Do = "Domain";
const _E = "Error";
const _EA = "EmailAddress";
const _ED = "EventDestination";
const _EDAEE = "EventDestinationAlreadyExistsException";
const _EDDNEE = "EventDestinationDoesNotExistException";
const _EDN = "EventDestinationName";
const _EDv = "EventDestinations";
const _EF = "ExtensionField";
const _EFL = "ExtensionFieldList";
const _EFx = "ExtensionFields";
const _En = "Enabled";
const _Enc = "Encoding";
const _Ex = "Explanation";
const _F = "Filter";
const _FA = "FunctionArn";
const _FAr = "FromArn";
const _FE = "ForwardingEnabled";
const _FEA = "FromEmailAddress";
const _FEANVE = "FromEmailAddressNotVerifiedException";
const _FN = "FilterName";
const _FR = "FinalRecipient";
const _FRURL = "FailureRedirectionURL";
const _Fi = "Filters";
const _GASE = "GetAccountSendingEnabled";
const _GASER = "GetAccountSendingEnabledResponse";
const _GCVET = "GetCustomVerificationEmailTemplate";
const _GCVETR = "GetCustomVerificationEmailTemplateRequest";
const _GCVETRe = "GetCustomVerificationEmailTemplateResponse";
const _GIDA = "GetIdentityDkimAttributes";
const _GIDAR = "GetIdentityDkimAttributesRequest";
const _GIDARe = "GetIdentityDkimAttributesResponse";
const _GIMFDA = "GetIdentityMailFromDomainAttributes";
const _GIMFDAR = "GetIdentityMailFromDomainAttributesRequest";
const _GIMFDARe = "GetIdentityMailFromDomainAttributesResponse";
const _GINA = "GetIdentityNotificationAttributes";
const _GINAR = "GetIdentityNotificationAttributesRequest";
const _GINARe = "GetIdentityNotificationAttributesResponse";
const _GIP = "GetIdentityPolicies";
const _GIPR = "GetIdentityPoliciesRequest";
const _GIPRe = "GetIdentityPoliciesResponse";
const _GIVA = "GetIdentityVerificationAttributes";
const _GIVAR = "GetIdentityVerificationAttributesRequest";
const _GIVARe = "GetIdentityVerificationAttributesResponse";
const _GSQ = "GetSendQuota";
const _GSQR = "GetSendQuotaResponse";
const _GSS = "GetSendStatistics";
const _GSSR = "GetSendStatisticsResponse";
const _GT = "GetTemplate";
const _GTR = "GetTemplateRequest";
const _GTRe = "GetTemplateResponse";
const _H = "Html";
const _HIBNE = "HeadersInBounceNotificationsEnabled";
const _HICNE = "HeadersInComplaintNotificationsEnabled";
const _HIDNE = "HeadersInDeliveryNotificationsEnabled";
const _HN = "HeaderName";
const _HP = "HtmlPart";
const _HV = "HeaderValue";
const _I = "Identity";
const _IAMRARN = "IAMRoleARN";
const _IARN = "InstanceARN";
const _ICSE = "InvalidConfigurationSetException";
const _ICWDE = "InvalidCloudWatchDestinationException";
const _IDA = "IdentityDkimAttributes";
const _IDOE = "InvalidDeliveryOptionsException";
const _IF = "IpFilter";
const _IFDE = "InvalidFirehoseDestinationException";
const _ILFE = "InvalidLambdaFunctionException";
const _IMFDA = "IdentityMailFromDomainAttributes";
const _INA = "IdentityNotificationAttributes";
const _IPE = "InvalidPolicyException";
const _IRA = "IamRoleArn";
const _IRPE = "InvalidRenderingParameterException";
const _ISCE = "InvalidS3ConfigurationException";
const _ISNSDE = "InvalidSNSDestinationException";
const _ISTE = "InvalidSnsTopicException";
const _IT = "InvocationType";
const _ITE = "InvalidTemplateException";
const _ITOE = "InvalidTrackingOptionsException";
const _ITd = "IdentityType";
const _IVA = "IdentityVerificationAttributes";
const _Id = "Identities";
const _KFD = "KinesisFirehoseDestination";
const _KKA = "KmsKeyArn";
const _LA = "LambdaAction";
const _LAD = "LastAttemptDate";
const _LCS = "ListConfigurationSets";
const _LCSR = "ListConfigurationSetsRequest";
const _LCSRi = "ListConfigurationSetsResponse";
const _LCVET = "ListCustomVerificationEmailTemplates";
const _LCVETR = "ListCustomVerificationEmailTemplatesRequest";
const _LCVETRi = "ListCustomVerificationEmailTemplatesResponse";
const _LEE = "LimitExceededException";
const _LFS = "LastFreshStart";
const _LI = "ListIdentities";
const _LIP = "ListIdentityPolicies";
const _LIPR = "ListIdentityPoliciesRequest";
const _LIPRi = "ListIdentityPoliciesResponse";
const _LIR = "ListIdentitiesRequest";
const _LIRi = "ListIdentitiesResponse";
const _LRF = "ListReceiptFilters";
const _LRFR = "ListReceiptFiltersRequest";
const _LRFRi = "ListReceiptFiltersResponse";
const _LRRS = "ListReceiptRuleSets";
const _LRRSR = "ListReceiptRuleSetsRequest";
const _LRRSRi = "ListReceiptRuleSetsResponse";
const _LT = "ListTemplates";
const _LTR = "ListTemplatesRequest";
const _LTRi = "ListTemplatesResponse";
const _LVEA = "ListVerifiedEmailAddresses";
const _LVEAR = "ListVerifiedEmailAddressesResponse";
const _M = "Message";
const _MD = "MessageDsn";
const _MET = "MatchingEventTypes";
const _MFD = "MailFromDomain";
const _MFDA = "MailFromDomainAttributes";
const _MFDNVE = "MailFromDomainNotVerifiedException";
const _MFDS = "MailFromDomainStatus";
const _MHS = "Max24HourSend";
const _MI = "MessageId";
const _MIa = "MaxItems";
const _MR = "MaxResults";
const _MRAE = "MissingRenderingAttributeException";
const _MRe = "MessageRejected";
const _MSR = "MaxSendRate";
const _MT = "MessageTag";
const _MTL = "MessageTagList";
const _Me = "Metadata";
const _N = "Name";
const _NA = "NotificationAttributes";
const _NT = "NextToken";
const _NTo = "NotificationType";
const _OA = "OrganizationArn";
const _OKP = "ObjectKeyPrefix";
const _OMI = "OriginalMessageId";
const _ORSN = "OriginalRuleSetName";
const _P = "Policies";
const _PANGE = "ProductionAccessNotGrantedException";
const _PCSDO = "PutConfigurationSetDeliveryOptions";
const _PCSDOR = "PutConfigurationSetDeliveryOptionsRequest";
const _PCSDORu = "PutConfigurationSetDeliveryOptionsResponse";
const _PIP = "PutIdentityPolicy";
const _PIPR = "PutIdentityPolicyRequest";
const _PIPRu = "PutIdentityPolicyResponse";
const _PN = "PolicyName";
const _PNo = "PolicyNames";
const _Po = "Policy";
const _R = "Recipient";
const _RA = "RecipientArn";
const _RAL = "ReceiptActionsList";
const _RAe = "ReceiptAction";
const _RDF = "RecipientDsnFields";
const _RDNEE = "RuleDoesNotExistException";
const _RF = "ReceiptFilter";
const _RFL = "ReceiptFilterList";
const _RIF = "ReceiptIpFilter";
const _RM = "ReportingMta";
const _RME = "ReputationMetricsEnabled";
const _RMa = "RawMessage";
const _RMe = "RemoteMta";
const _RN = "RuleName";
const _RNu = "RuleNames";
const _RO = "ReputationOptions";
const _RP = "ReturnPath";
const _RPA = "ReturnPathArn";
const _RR = "ReceiptRule";
const _RRL = "ReceiptRulesList";
const _RRRS = "ReorderReceiptRuleSet";
const _RRRSR = "ReorderReceiptRuleSetRequest";
const _RRRSRe = "ReorderReceiptRuleSetResponse";
const _RRSL = "ReceiptRuleSetsLists";
const _RRSM = "ReceiptRuleSetMetadata";
const _RS = "RuleSets";
const _RSDNEE = "RuleSetDoesNotExistException";
const _RSN = "RuleSetName";
const _RT = "ReplacementTags";
const _RTA = "ReplyToAddresses";
const _RTD = "ReplacementTemplateData";
const _RTe = "RenderedTemplate";
const _Re = "Recipients";
const _Rej = "Rejects";
const _Ru = "Rule";
const _Rul = "Rules";
const _S = "Sender";
const _SA = "S3Action";
const _SARRS = "SetActiveReceiptRuleSet";
const _SARRSR = "SetActiveReceiptRuleSetRequest";
const _SARRSRe = "SetActiveReceiptRuleSetResponse";
const _SAo = "SourceArn";
const _SAt = "StopAction";
const _SB = "SendBounce";
const _SBR = "SendBounceRequest";
const _SBRe = "SendBounceResponse";
const _SBTE = "SendBulkTemplatedEmail";
const _SBTER = "SendBulkTemplatedEmailRequest";
const _SBTERe = "SendBulkTemplatedEmailResponse";
const _SC = "StatusCode";
const _SCVE = "SendCustomVerificationEmail";
const _SCVER = "SendCustomVerificationEmailRequest";
const _SCVERe = "SendCustomVerificationEmailResponse";
const _SDP = "SendDataPoints";
const _SDPL = "SendDataPointList";
const _SDPe = "SendDataPoint";
const _SE = "ScanEnabled";
const _SER = "SendEmailRequest";
const _SERe = "SendEmailResponse";
const _SEe = "SendingEnabled";
const _SEen = "SendEmail";
const _SIDE = "SetIdentityDkimEnabled";
const _SIDER = "SetIdentityDkimEnabledRequest";
const _SIDERe = "SetIdentityDkimEnabledResponse";
const _SIFFE = "SetIdentityFeedbackForwardingEnabled";
const _SIFFER = "SetIdentityFeedbackForwardingEnabledRequest";
const _SIFFERe = "SetIdentityFeedbackForwardingEnabledResponse";
const _SIHINE = "SetIdentityHeadersInNotificationsEnabled";
const _SIHINER = "SetIdentityHeadersInNotificationsEnabledRequest";
const _SIHINERe = "SetIdentityHeadersInNotificationsEnabledResponse";
const _SIMFD = "SetIdentityMailFromDomain";
const _SIMFDR = "SetIdentityMailFromDomainRequest";
const _SIMFDRe = "SetIdentityMailFromDomainResponse";
const _SINT = "SetIdentityNotificationTopic";
const _SINTR = "SetIdentityNotificationTopicRequest";
const _SINTRe = "SetIdentityNotificationTopicResponse";
const _SLH = "SentLast24Hours";
const _SNSA = "SNSAction";
const _SNSD = "SNSDestination";
const _SP = "SubjectPart";
const _SRC = "SmtpReplyCode";
const _SRE = "SendRawEmail";
const _SRER = "SendRawEmailRequest";
const _SRERe = "SendRawEmailResponse";
const _SRRP = "SetReceiptRulePosition";
const _SRRPR = "SetReceiptRulePositionRequest";
const _SRRPRe = "SetReceiptRulePositionResponse";
const _SRURL = "SuccessRedirectionURL";
const _ST = "SnsTopic";
const _STE = "SendTemplatedEmail";
const _STER = "SendTemplatedEmailRequest";
const _STERe = "SendTemplatedEmailResponse";
const _Sc = "Scope";
const _So = "Source";
const _St = "Status";
const _Su = "Subject";
const _T = "Text";
const _TA = "TopicArn";
const _TARN = "TopicARN";
const _TAe = "TemplateArn";
const _TAo = "ToAddresses";
const _TC = "TemplateContent";
const _TD = "TemplateData";
const _TDNEE = "TemplateDoesNotExistException";
const _TM = "TemplatesMetadata";
const _TML = "TemplateMetadataList";
const _TMe = "TemplateMetadata";
const _TN = "TemplateName";
const _TO = "TrackingOptions";
const _TOAEE = "TrackingOptionsAlreadyExistsException";
const _TODNEE = "TrackingOptionsDoesNotExistException";
const _TP = "TlsPolicy";
const _TPe = "TextPart";
const _TRT = "TestRenderTemplate";
const _TRTR = "TestRenderTemplateRequest";
const _TRTRe = "TestRenderTemplateResponse";
const _TS = "TemplateSubject";
const _Ta = "Tags";
const _Te = "Template";
const _Ti = "Timestamp";
const _To = "Topic";
const _UASE = "UpdateAccountSendingEnabled";
const _UASER = "UpdateAccountSendingEnabledRequest";
const _UCSED = "UpdateConfigurationSetEventDestination";
const _UCSEDR = "UpdateConfigurationSetEventDestinationRequest";
const _UCSEDRp = "UpdateConfigurationSetEventDestinationResponse";
const _UCSRME = "UpdateConfigurationSetReputationMetricsEnabled";
const _UCSRMER = "UpdateConfigurationSetReputationMetricsEnabledRequest";
const _UCSSE = "UpdateConfigurationSetSendingEnabled";
const _UCSSER = "UpdateConfigurationSetSendingEnabledRequest";
const _UCSTO = "UpdateConfigurationSetTrackingOptions";
const _UCSTOR = "UpdateConfigurationSetTrackingOptionsRequest";
const _UCSTORp = "UpdateConfigurationSetTrackingOptionsResponse";
const _UCVET = "UpdateCustomVerificationEmailTemplate";
const _UCVETR = "UpdateCustomVerificationEmailTemplateRequest";
const _URR = "UpdateReceiptRule";
const _URRR = "UpdateReceiptRuleRequest";
const _URRRp = "UpdateReceiptRuleResponse";
const _UT = "UpdateTemplate";
const _UTR = "UpdateTemplateRequest";
const _UTRp = "UpdateTemplateResponse";
const _V = "Value";
const _VA = "VerificationAttributes";
const _VDD = "VerifyDomainDkim";
const _VDDR = "VerifyDomainDkimRequest";
const _VDDRe = "VerifyDomainDkimResponse";
const _VDI = "VerifyDomainIdentity";
const _VDIR = "VerifyDomainIdentityRequest";
const _VDIRe = "VerifyDomainIdentityResponse";
const _VEA = "VerifiedEmailAddresses";
const _VEAR = "VerifyEmailAddressRequest";
const _VEAe = "VerifyEmailAddress";
const _VEI = "VerifyEmailIdentity";
const _VEIR = "VerifyEmailIdentityRequest";
const _VEIRe = "VerifyEmailIdentityResponse";
const _VS = "VerificationStatus";
const _VT = "VerificationToken";
const _WA = "WorkmailAction";
const _aQE = "awsQueryError";
const _c = "client";
const _e = "error";
const _hE = "httpError";
const _m = "message";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.ses";
const n0 = "com.amazonaws.ses";
var AccountSendingPausedException = [
    -3,
    n0,
    _ASPE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`AccountSendingPausedException`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(AccountSendingPausedException, AccountSendingPausedException$1);
var AddHeaderAction = [3, n0, _AHA, 0, [_HN, _HV], [0, 0]];
var AlreadyExistsException = [
    -3,
    n0,
    _AEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`AlreadyExists`, 400],
    },
    [_N, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(AlreadyExistsException, AlreadyExistsException$1);
var Body = [3, n0, _B, 0, [_T, _H], [() => Content, () => Content]];
var BounceAction = [3, n0, _BA, 0, [_TA, _SRC, _SC, _M, _S], [0, 0, 0, 0, 0]];
var BouncedRecipientInfo = [
    3,
    n0,
    _BRI,
    0,
    [_R, _RA, _BT, _RDF],
    [0, 0, 0, () => RecipientDsnFields],
];
var BulkEmailDestination = [
    3,
    n0,
    _BED,
    0,
    [_D, _RT, _RTD],
    [() => Destination, () => MessageTagList, 0],
];
var BulkEmailDestinationStatus = [3, n0, _BEDS, 0, [_St, _E, _MI], [0, 0, 0]];
var CannotDeleteException = [
    -3,
    n0,
    _CDE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`CannotDelete`, 400],
    },
    [_N, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(CannotDeleteException, CannotDeleteException$1);
var CloneReceiptRuleSetRequest = [3, n0, _CRRSR, 0, [_RSN, _ORSN], [0, 0]];
var CloneReceiptRuleSetResponse = [3, n0, _CRRSRl, 0, [], []];
var CloudWatchDestination = [
    3,
    n0,
    _CWD,
    0,
    [_DC],
    [() => CloudWatchDimensionConfigurations],
];
var CloudWatchDimensionConfiguration = [3, n0, _CWDC, 0, [_DN, _DVS, _DDV], [0, 0, 0]];
var ConfigurationSet = [3, n0, _CS, 0, [_N], [0]];
var ConfigurationSetAlreadyExistsException = [
    -3,
    n0,
    _CSAEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`ConfigurationSetAlreadyExists`, 400],
    },
    [_CSN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(ConfigurationSetAlreadyExistsException, ConfigurationSetAlreadyExistsException$1);
var ConfigurationSetDoesNotExistException = [
    -3,
    n0,
    _CSDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`ConfigurationSetDoesNotExist`, 400],
    },
    [_CSN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(ConfigurationSetDoesNotExistException, ConfigurationSetDoesNotExistException$1);
var ConfigurationSetSendingPausedException = [
    -3,
    n0,
    _CSSPE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`ConfigurationSetSendingPausedException`, 400],
    },
    [_CSN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(ConfigurationSetSendingPausedException, ConfigurationSetSendingPausedException$1);
var ConnectAction = [3, n0, _CA, 0, [_IARN, _IAMRARN], [0, 0]];
var Content = [3, n0, _C, 0, [_Da, _Ch], [0, 0]];
var CreateConfigurationSetEventDestinationRequest = [
    3,
    n0,
    _CCSEDR,
    0,
    [_CSN, _ED],
    [0, () => EventDestination],
];
var CreateConfigurationSetEventDestinationResponse = [3, n0, _CCSEDRr, 0, [], []];
var CreateConfigurationSetRequest = [3, n0, _CCSR, 0, [_CS], [() => ConfigurationSet]];
var CreateConfigurationSetResponse = [3, n0, _CCSRr, 0, [], []];
var CreateConfigurationSetTrackingOptionsRequest = [
    3,
    n0,
    _CCSTOR,
    0,
    [_CSN, _TO],
    [0, () => TrackingOptions],
];
var CreateConfigurationSetTrackingOptionsResponse = [3, n0, _CCSTORr, 0, [], []];
var CreateCustomVerificationEmailTemplateRequest = [
    3,
    n0,
    _CCVETR,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0],
];
var CreateReceiptFilterRequest = [3, n0, _CRFR, 0, [_F], [() => ReceiptFilter]];
var CreateReceiptFilterResponse = [3, n0, _CRFRr, 0, [], []];
var CreateReceiptRuleRequest = [
    3,
    n0,
    _CRRR,
    0,
    [_RSN, _A, _Ru],
    [0, 0, () => ReceiptRule],
];
var CreateReceiptRuleResponse = [3, n0, _CRRRr, 0, [], []];
var CreateReceiptRuleSetRequest = [3, n0, _CRRSRr, 0, [_RSN], [0]];
var CreateReceiptRuleSetResponse = [3, n0, _CRRSRre, 0, [], []];
var CreateTemplateRequest = [3, n0, _CTR, 0, [_Te], [() => Template]];
var CreateTemplateResponse = [3, n0, _CTRr, 0, [], []];
var CustomVerificationEmailInvalidContentException = [
    -3,
    n0,
    _CVEICE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`CustomVerificationEmailInvalidContent`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(CustomVerificationEmailInvalidContentException, CustomVerificationEmailInvalidContentException$1);
var CustomVerificationEmailTemplate = [
    3,
    n0,
    _CVET,
    0,
    [_TN, _FEA, _TS, _SRURL, _FRURL],
    [0, 0, 0, 0, 0],
];
var CustomVerificationEmailTemplateAlreadyExistsException = [
    -3,
    n0,
    _CVETAEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`CustomVerificationEmailTemplateAlreadyExists`, 400],
    },
    [_CVETN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(CustomVerificationEmailTemplateAlreadyExistsException, CustomVerificationEmailTemplateAlreadyExistsException$1);
var CustomVerificationEmailTemplateDoesNotExistException = [
    -3,
    n0,
    _CVETDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`CustomVerificationEmailTemplateDoesNotExist`, 400],
    },
    [_CVETN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(CustomVerificationEmailTemplateDoesNotExistException, CustomVerificationEmailTemplateDoesNotExistException$1);
var DeleteConfigurationSetEventDestinationRequest = [
    3,
    n0,
    _DCSEDR,
    0,
    [_CSN, _EDN],
    [0, 0],
];
var DeleteConfigurationSetEventDestinationResponse = [3, n0, _DCSEDRe, 0, [], []];
var DeleteConfigurationSetRequest = [3, n0, _DCSR, 0, [_CSN], [0]];
var DeleteConfigurationSetResponse = [3, n0, _DCSRe, 0, [], []];
var DeleteConfigurationSetTrackingOptionsRequest = [3, n0, _DCSTOR, 0, [_CSN], [0]];
var DeleteConfigurationSetTrackingOptionsResponse = [3, n0, _DCSTORe, 0, [], []];
var DeleteCustomVerificationEmailTemplateRequest = [3, n0, _DCVETR, 0, [_TN], [0]];
var DeleteIdentityPolicyRequest = [3, n0, _DIPR, 0, [_I, _PN], [0, 0]];
var DeleteIdentityPolicyResponse = [3, n0, _DIPRe, 0, [], []];
var DeleteIdentityRequest = [3, n0, _DIR, 0, [_I], [0]];
var DeleteIdentityResponse = [3, n0, _DIRe, 0, [], []];
var DeleteReceiptFilterRequest = [3, n0, _DRFR, 0, [_FN], [0]];
var DeleteReceiptFilterResponse = [3, n0, _DRFRe, 0, [], []];
var DeleteReceiptRuleRequest = [3, n0, _DRRR, 0, [_RSN, _RN], [0, 0]];
var DeleteReceiptRuleResponse = [3, n0, _DRRRe, 0, [], []];
var DeleteReceiptRuleSetRequest = [3, n0, _DRRSR, 0, [_RSN], [0]];
var DeleteReceiptRuleSetResponse = [3, n0, _DRRSRe, 0, [], []];
var DeleteTemplateRequest = [3, n0, _DTR, 0, [_TN], [0]];
var DeleteTemplateResponse = [3, n0, _DTRe, 0, [], []];
var DeleteVerifiedEmailAddressRequest = [3, n0, _DVEAR, 0, [_EA], [0]];
var DeliveryOptions = [3, n0, _DO, 0, [_TP], [0]];
var DescribeActiveReceiptRuleSetRequest = [3, n0, _DARRSR, 0, [], []];
var DescribeActiveReceiptRuleSetResponse = [
    3,
    n0,
    _DARRSRe,
    0,
    [_Me, _Rul],
    [() => ReceiptRuleSetMetadata, () => ReceiptRulesList],
];
var DescribeConfigurationSetRequest = [3, n0, _DCSRes, 0, [_CSN, _CSAN], [0, 64 | 0]];
var DescribeConfigurationSetResponse = [
    3,
    n0,
    _DCSResc,
    0,
    [_CS, _EDv, _TO, _DO, _RO],
    [
        () => ConfigurationSet,
        () => EventDestinations,
        () => TrackingOptions,
        () => DeliveryOptions,
        () => ReputationOptions,
    ],
];
var DescribeReceiptRuleRequest = [3, n0, _DRRRes, 0, [_RSN, _RN], [0, 0]];
var DescribeReceiptRuleResponse = [3, n0, _DRRResc, 0, [_Ru], [() => ReceiptRule]];
var DescribeReceiptRuleSetRequest = [3, n0, _DRRSRes, 0, [_RSN], [0]];
var DescribeReceiptRuleSetResponse = [
    3,
    n0,
    _DRRSResc,
    0,
    [_Me, _Rul],
    [() => ReceiptRuleSetMetadata, () => ReceiptRulesList],
];
var Destination = [3, n0, _D, 0, [_TAo, _CAc, _BAc], [64 | 0, 64 | 0, 64 | 0]];
var EventDestination = [
    3,
    n0,
    _ED,
    0,
    [_N, _En, _MET, _KFD, _CWD, _SNSD],
    [0, 2, 64 | 0, () => KinesisFirehoseDestination, () => CloudWatchDestination, () => SNSDestination],
];
var EventDestinationAlreadyExistsException = [
    -3,
    n0,
    _EDAEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`EventDestinationAlreadyExists`, 400],
    },
    [_CSN, _EDN, _m],
    [0, 0, 0],
];
schema.TypeRegistry.for(n0).registerError(EventDestinationAlreadyExistsException, EventDestinationAlreadyExistsException$1);
var EventDestinationDoesNotExistException = [
    -3,
    n0,
    _EDDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`EventDestinationDoesNotExist`, 400],
    },
    [_CSN, _EDN, _m],
    [0, 0, 0],
];
schema.TypeRegistry.for(n0).registerError(EventDestinationDoesNotExistException, EventDestinationDoesNotExistException$1);
var ExtensionField = [3, n0, _EF, 0, [_N, _V], [0, 0]];
var FromEmailAddressNotVerifiedException = [
    -3,
    n0,
    _FEANVE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`FromEmailAddressNotVerified`, 400],
    },
    [_FEA, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(FromEmailAddressNotVerifiedException, FromEmailAddressNotVerifiedException$1);
var GetAccountSendingEnabledResponse = [3, n0, _GASER, 0, [_En], [2]];
var GetCustomVerificationEmailTemplateRequest = [3, n0, _GCVETR, 0, [_TN], [0]];
var GetCustomVerificationEmailTemplateResponse = [
    3,
    n0,
    _GCVETRe,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0],
];
var GetIdentityDkimAttributesRequest = [3, n0, _GIDAR, 0, [_Id], [64 | 0]];
var GetIdentityDkimAttributesResponse = [
    3,
    n0,
    _GIDARe,
    0,
    [_DA],
    [() => DkimAttributes],
];
var GetIdentityMailFromDomainAttributesRequest = [3, n0, _GIMFDAR, 0, [_Id], [64 | 0]];
var GetIdentityMailFromDomainAttributesResponse = [
    3,
    n0,
    _GIMFDARe,
    0,
    [_MFDA],
    [() => MailFromDomainAttributes],
];
var GetIdentityNotificationAttributesRequest = [3, n0, _GINAR, 0, [_Id], [64 | 0]];
var GetIdentityNotificationAttributesResponse = [
    3,
    n0,
    _GINARe,
    0,
    [_NA],
    [() => NotificationAttributes],
];
var GetIdentityPoliciesRequest = [3, n0, _GIPR, 0, [_I, _PNo], [0, 64 | 0]];
var GetIdentityPoliciesResponse = [3, n0, _GIPRe, 0, [_P], [128 | 0]];
var GetIdentityVerificationAttributesRequest = [3, n0, _GIVAR, 0, [_Id], [64 | 0]];
var GetIdentityVerificationAttributesResponse = [
    3,
    n0,
    _GIVARe,
    0,
    [_VA],
    [() => VerificationAttributes],
];
var GetSendQuotaResponse = [3, n0, _GSQR, 0, [_MHS, _MSR, _SLH], [1, 1, 1]];
var GetSendStatisticsResponse = [3, n0, _GSSR, 0, [_SDP], [() => SendDataPointList]];
var GetTemplateRequest = [3, n0, _GTR, 0, [_TN], [0]];
var GetTemplateResponse = [3, n0, _GTRe, 0, [_Te], [() => Template]];
var IdentityDkimAttributes = [3, n0, _IDA, 0, [_DE, _DVSk, _DT], [2, 0, 64 | 0]];
var IdentityMailFromDomainAttributes = [
    3,
    n0,
    _IMFDA,
    0,
    [_MFD, _MFDS, _BOMXF],
    [0, 0, 0],
];
var IdentityNotificationAttributes = [
    3,
    n0,
    _INA,
    0,
    [_BTo, _CT, _DTe, _FE, _HIBNE, _HICNE, _HIDNE],
    [0, 0, 0, 2, 2, 2, 2],
];
var IdentityVerificationAttributes = [3, n0, _IVA, 0, [_VS, _VT], [0, 0]];
var InvalidCloudWatchDestinationException = [
    -3,
    n0,
    _ICWDE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidCloudWatchDestination`, 400],
    },
    [_CSN, _EDN, _m],
    [0, 0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidCloudWatchDestinationException, InvalidCloudWatchDestinationException$1);
var InvalidConfigurationSetException = [
    -3,
    n0,
    _ICSE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidConfigurationSet`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(InvalidConfigurationSetException, InvalidConfigurationSetException$1);
var InvalidDeliveryOptionsException = [
    -3,
    n0,
    _IDOE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidDeliveryOptions`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(InvalidDeliveryOptionsException, InvalidDeliveryOptionsException$1);
var InvalidFirehoseDestinationException = [
    -3,
    n0,
    _IFDE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidFirehoseDestination`, 400],
    },
    [_CSN, _EDN, _m],
    [0, 0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidFirehoseDestinationException, InvalidFirehoseDestinationException$1);
var InvalidLambdaFunctionException = [
    -3,
    n0,
    _ILFE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidLambdaFunction`, 400],
    },
    [_FA, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidLambdaFunctionException, InvalidLambdaFunctionException$1);
var InvalidPolicyException = [
    -3,
    n0,
    _IPE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidPolicy`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(InvalidPolicyException, InvalidPolicyException$1);
var InvalidRenderingParameterException = [
    -3,
    n0,
    _IRPE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidRenderingParameter`, 400],
    },
    [_TN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidRenderingParameterException, InvalidRenderingParameterException$1);
var InvalidS3ConfigurationException = [
    -3,
    n0,
    _ISCE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidS3Configuration`, 400],
    },
    [_Bu, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidS3ConfigurationException, InvalidS3ConfigurationException$1);
var InvalidSNSDestinationException = [
    -3,
    n0,
    _ISNSDE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidSNSDestination`, 400],
    },
    [_CSN, _EDN, _m],
    [0, 0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidSNSDestinationException, InvalidSNSDestinationException$1);
var InvalidSnsTopicException = [
    -3,
    n0,
    _ISTE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidSnsTopic`, 400],
    },
    [_To, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidSnsTopicException, InvalidSnsTopicException$1);
var InvalidTemplateException = [
    -3,
    n0,
    _ITE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidTemplate`, 400],
    },
    [_TN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(InvalidTemplateException, InvalidTemplateException$1);
var InvalidTrackingOptionsException = [
    -3,
    n0,
    _ITOE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`InvalidTrackingOptions`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(InvalidTrackingOptionsException, InvalidTrackingOptionsException$1);
var KinesisFirehoseDestination = [3, n0, _KFD, 0, [_IAMRARN, _DSARN], [0, 0]];
var LambdaAction = [3, n0, _LA, 0, [_TA, _FA, _IT], [0, 0, 0]];
var LimitExceededException = [
    -3,
    n0,
    _LEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`LimitExceeded`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(LimitExceededException, LimitExceededException$1);
var ListConfigurationSetsRequest = [3, n0, _LCSR, 0, [_NT, _MIa], [0, 1]];
var ListConfigurationSetsResponse = [
    3,
    n0,
    _LCSRi,
    0,
    [_CSo, _NT],
    [() => ConfigurationSets, 0],
];
var ListCustomVerificationEmailTemplatesRequest = [3, n0, _LCVETR, 0, [_NT, _MR], [0, 1]];
var ListCustomVerificationEmailTemplatesResponse = [
    3,
    n0,
    _LCVETRi,
    0,
    [_CVETu, _NT],
    [() => CustomVerificationEmailTemplates, 0],
];
var ListIdentitiesRequest = [3, n0, _LIR, 0, [_ITd, _NT, _MIa], [0, 0, 1]];
var ListIdentitiesResponse = [3, n0, _LIRi, 0, [_Id, _NT], [64 | 0, 0]];
var ListIdentityPoliciesRequest = [3, n0, _LIPR, 0, [_I], [0]];
var ListIdentityPoliciesResponse = [3, n0, _LIPRi, 0, [_PNo], [64 | 0]];
var ListReceiptFiltersRequest = [3, n0, _LRFR, 0, [], []];
var ListReceiptFiltersResponse = [3, n0, _LRFRi, 0, [_Fi], [() => ReceiptFilterList]];
var ListReceiptRuleSetsRequest = [3, n0, _LRRSR, 0, [_NT], [0]];
var ListReceiptRuleSetsResponse = [
    3,
    n0,
    _LRRSRi,
    0,
    [_RS, _NT],
    [() => ReceiptRuleSetsLists, 0],
];
var ListTemplatesRequest = [3, n0, _LTR, 0, [_NT, _MIa], [0, 1]];
var ListTemplatesResponse = [
    3,
    n0,
    _LTRi,
    0,
    [_TM, _NT],
    [() => TemplateMetadataList, 0],
];
var ListVerifiedEmailAddressesResponse = [3, n0, _LVEAR, 0, [_VEA], [64 | 0]];
var MailFromDomainNotVerifiedException = [
    -3,
    n0,
    _MFDNVE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`MailFromDomainNotVerifiedException`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(MailFromDomainNotVerifiedException, MailFromDomainNotVerifiedException$1);
var Message = [3, n0, _M, 0, [_Su, _B], [() => Content, () => Body]];
var MessageDsn = [3, n0, _MD, 0, [_RM, _AD, _EFx], [0, 4, () => ExtensionFieldList]];
var MessageRejected = [
    -3,
    n0,
    _MRe,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`MessageRejected`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(MessageRejected, MessageRejected$1);
var MessageTag = [3, n0, _MT, 0, [_N, _V], [0, 0]];
var MissingRenderingAttributeException = [
    -3,
    n0,
    _MRAE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`MissingRenderingAttribute`, 400],
    },
    [_TN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(MissingRenderingAttributeException, MissingRenderingAttributeException$1);
var ProductionAccessNotGrantedException = [
    -3,
    n0,
    _PANGE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`ProductionAccessNotGranted`, 400],
    },
    [_m],
    [0],
];
schema.TypeRegistry.for(n0).registerError(ProductionAccessNotGrantedException, ProductionAccessNotGrantedException$1);
var PutConfigurationSetDeliveryOptionsRequest = [
    3,
    n0,
    _PCSDOR,
    0,
    [_CSN, _DO],
    [0, () => DeliveryOptions],
];
var PutConfigurationSetDeliveryOptionsResponse = [3, n0, _PCSDORu, 0, [], []];
var PutIdentityPolicyRequest = [3, n0, _PIPR, 0, [_I, _PN, _Po], [0, 0, 0]];
var PutIdentityPolicyResponse = [3, n0, _PIPRu, 0, [], []];
var RawMessage = [3, n0, _RMa, 0, [_Da], [21]];
var ReceiptAction = [
    3,
    n0,
    _RAe,
    0,
    [_SA, _BA, _WA, _LA, _SAt, _AHA, _SNSA, _CA],
    [
        () => S3Action,
        () => BounceAction,
        () => WorkmailAction,
        () => LambdaAction,
        () => StopAction,
        () => AddHeaderAction,
        () => SNSAction,
        () => ConnectAction,
    ],
];
var ReceiptFilter = [3, n0, _RF, 0, [_N, _IF], [0, () => ReceiptIpFilter]];
var ReceiptIpFilter = [3, n0, _RIF, 0, [_Po, _Ci], [0, 0]];
var ReceiptRule = [
    3,
    n0,
    _RR,
    0,
    [_N, _En, _TP, _Re, _Ac, _SE],
    [0, 2, 0, 64 | 0, () => ReceiptActionsList, 2],
];
var ReceiptRuleSetMetadata = [3, n0, _RRSM, 0, [_N, _CTr], [0, 4]];
var RecipientDsnFields = [
    3,
    n0,
    _RDF,
    0,
    [_FR, _Act, _RMe, _St, _DCi, _LAD, _EFx],
    [0, 0, 0, 0, 0, 4, () => ExtensionFieldList],
];
var ReorderReceiptRuleSetRequest = [3, n0, _RRRSR, 0, [_RSN, _RNu], [0, 64 | 0]];
var ReorderReceiptRuleSetResponse = [3, n0, _RRRSRe, 0, [], []];
var ReputationOptions = [3, n0, _RO, 0, [_SEe, _RME, _LFS], [2, 2, 4]];
var RuleDoesNotExistException = [
    -3,
    n0,
    _RDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`RuleDoesNotExist`, 400],
    },
    [_N, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(RuleDoesNotExistException, RuleDoesNotExistException$1);
var RuleSetDoesNotExistException = [
    -3,
    n0,
    _RSDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`RuleSetDoesNotExist`, 400],
    },
    [_N, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(RuleSetDoesNotExistException, RuleSetDoesNotExistException$1);
var S3Action = [3, n0, _SA, 0, [_TA, _BN, _OKP, _KKA, _IRA], [0, 0, 0, 0, 0]];
var SendBounceRequest = [
    3,
    n0,
    _SBR,
    0,
    [_OMI, _BS, _Ex, _MD, _BRIL, _BSA],
    [0, 0, 0, () => MessageDsn, () => BouncedRecipientInfoList, 0],
];
var SendBounceResponse = [3, n0, _SBRe, 0, [_MI], [0]];
var SendBulkTemplatedEmailRequest = [
    3,
    n0,
    _SBTER,
    0,
    [_So, _SAo, _RTA, _RP, _RPA, _CSN, _DTef, _Te, _TAe, _DTD, _De],
    [0, 0, 64 | 0, 0, 0, 0, () => MessageTagList, 0, 0, 0, () => BulkEmailDestinationList],
];
var SendBulkTemplatedEmailResponse = [
    3,
    n0,
    _SBTERe,
    0,
    [_St],
    [() => BulkEmailDestinationStatusList],
];
var SendCustomVerificationEmailRequest = [3, n0, _SCVER, 0, [_EA, _TN, _CSN], [0, 0, 0]];
var SendCustomVerificationEmailResponse = [3, n0, _SCVERe, 0, [_MI], [0]];
var SendDataPoint = [3, n0, _SDPe, 0, [_Ti, _DAe, _Bo, _Co, _Rej], [4, 1, 1, 1, 1]];
var SendEmailRequest = [
    3,
    n0,
    _SER,
    0,
    [_So, _D, _M, _RTA, _RP, _SAo, _RPA, _Ta, _CSN],
    [0, () => Destination, () => Message, 64 | 0, 0, 0, 0, () => MessageTagList, 0],
];
var SendEmailResponse = [3, n0, _SERe, 0, [_MI], [0]];
var SendRawEmailRequest = [
    3,
    n0,
    _SRER,
    0,
    [_So, _De, _RMa, _FAr, _SAo, _RPA, _Ta, _CSN],
    [0, 64 | 0, () => RawMessage, 0, 0, 0, () => MessageTagList, 0],
];
var SendRawEmailResponse = [3, n0, _SRERe, 0, [_MI], [0]];
var SendTemplatedEmailRequest = [
    3,
    n0,
    _STER,
    0,
    [_So, _D, _RTA, _RP, _SAo, _RPA, _Ta, _CSN, _Te, _TAe, _TD],
    [0, () => Destination, 64 | 0, 0, 0, 0, () => MessageTagList, 0, 0, 0, 0],
];
var SendTemplatedEmailResponse = [3, n0, _STERe, 0, [_MI], [0]];
var SetActiveReceiptRuleSetRequest = [3, n0, _SARRSR, 0, [_RSN], [0]];
var SetActiveReceiptRuleSetResponse = [3, n0, _SARRSRe, 0, [], []];
var SetIdentityDkimEnabledRequest = [3, n0, _SIDER, 0, [_I, _DE], [0, 2]];
var SetIdentityDkimEnabledResponse = [3, n0, _SIDERe, 0, [], []];
var SetIdentityFeedbackForwardingEnabledRequest = [3, n0, _SIFFER, 0, [_I, _FE], [0, 2]];
var SetIdentityFeedbackForwardingEnabledResponse = [3, n0, _SIFFERe, 0, [], []];
var SetIdentityHeadersInNotificationsEnabledRequest = [
    3,
    n0,
    _SIHINER,
    0,
    [_I, _NTo, _En],
    [0, 0, 2],
];
var SetIdentityHeadersInNotificationsEnabledResponse = [3, n0, _SIHINERe, 0, [], []];
var SetIdentityMailFromDomainRequest = [3, n0, _SIMFDR, 0, [_I, _MFD, _BOMXF], [0, 0, 0]];
var SetIdentityMailFromDomainResponse = [3, n0, _SIMFDRe, 0, [], []];
var SetIdentityNotificationTopicRequest = [3, n0, _SINTR, 0, [_I, _NTo, _ST], [0, 0, 0]];
var SetIdentityNotificationTopicResponse = [3, n0, _SINTRe, 0, [], []];
var SetReceiptRulePositionRequest = [3, n0, _SRRPR, 0, [_RSN, _RN, _A], [0, 0, 0]];
var SetReceiptRulePositionResponse = [3, n0, _SRRPRe, 0, [], []];
var SNSAction = [3, n0, _SNSA, 0, [_TA, _Enc], [0, 0]];
var SNSDestination = [3, n0, _SNSD, 0, [_TARN], [0]];
var StopAction = [3, n0, _SAt, 0, [_Sc, _TA], [0, 0]];
var Template = [3, n0, _Te, 0, [_TN, _SP, _TPe, _HP], [0, 0, 0, 0]];
var TemplateDoesNotExistException = [
    -3,
    n0,
    _TDNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`TemplateDoesNotExist`, 400],
    },
    [_TN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(TemplateDoesNotExistException, TemplateDoesNotExistException$1);
var TemplateMetadata = [3, n0, _TMe, 0, [_N, _CTr], [0, 4]];
var TestRenderTemplateRequest = [3, n0, _TRTR, 0, [_TN, _TD], [0, 0]];
var TestRenderTemplateResponse = [3, n0, _TRTRe, 0, [_RTe], [0]];
var TrackingOptions = [3, n0, _TO, 0, [_CRD], [0]];
var TrackingOptionsAlreadyExistsException = [
    -3,
    n0,
    _TOAEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`TrackingOptionsAlreadyExistsException`, 400],
    },
    [_CSN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(TrackingOptionsAlreadyExistsException, TrackingOptionsAlreadyExistsException$1);
var TrackingOptionsDoesNotExistException = [
    -3,
    n0,
    _TODNEE,
    {
        [_e]: _c,
        [_hE]: 400,
        [_aQE]: [`TrackingOptionsDoesNotExistException`, 400],
    },
    [_CSN, _m],
    [0, 0],
];
schema.TypeRegistry.for(n0).registerError(TrackingOptionsDoesNotExistException, TrackingOptionsDoesNotExistException$1);
var UpdateAccountSendingEnabledRequest = [3, n0, _UASER, 0, [_En], [2]];
var UpdateConfigurationSetEventDestinationRequest = [
    3,
    n0,
    _UCSEDR,
    0,
    [_CSN, _ED],
    [0, () => EventDestination],
];
var UpdateConfigurationSetEventDestinationResponse = [3, n0, _UCSEDRp, 0, [], []];
var UpdateConfigurationSetReputationMetricsEnabledRequest = [
    3,
    n0,
    _UCSRMER,
    0,
    [_CSN, _En],
    [0, 2],
];
var UpdateConfigurationSetSendingEnabledRequest = [
    3,
    n0,
    _UCSSER,
    0,
    [_CSN, _En],
    [0, 2],
];
var UpdateConfigurationSetTrackingOptionsRequest = [
    3,
    n0,
    _UCSTOR,
    0,
    [_CSN, _TO],
    [0, () => TrackingOptions],
];
var UpdateConfigurationSetTrackingOptionsResponse = [3, n0, _UCSTORp, 0, [], []];
var UpdateCustomVerificationEmailTemplateRequest = [
    3,
    n0,
    _UCVETR,
    0,
    [_TN, _FEA, _TS, _TC, _SRURL, _FRURL],
    [0, 0, 0, 0, 0, 0],
];
var UpdateReceiptRuleRequest = [3, n0, _URRR, 0, [_RSN, _Ru], [0, () => ReceiptRule]];
var UpdateReceiptRuleResponse = [3, n0, _URRRp, 0, [], []];
var UpdateTemplateRequest = [3, n0, _UTR, 0, [_Te], [() => Template]];
var UpdateTemplateResponse = [3, n0, _UTRp, 0, [], []];
var VerifyDomainDkimRequest = [3, n0, _VDDR, 0, [_Do], [0]];
var VerifyDomainDkimResponse = [3, n0, _VDDRe, 0, [_DT], [64 | 0]];
var VerifyDomainIdentityRequest = [3, n0, _VDIR, 0, [_Do], [0]];
var VerifyDomainIdentityResponse = [3, n0, _VDIRe, 0, [_VT], [0]];
var VerifyEmailAddressRequest = [3, n0, _VEAR, 0, [_EA], [0]];
var VerifyEmailIdentityRequest = [3, n0, _VEIR, 0, [_EA], [0]];
var VerifyEmailIdentityResponse = [3, n0, _VEIRe, 0, [], []];
var WorkmailAction = [3, n0, _WA, 0, [_TA, _OA], [0, 0]];
var __Unit = "unit";
var SESServiceException = [-3, _s, "SESServiceException", 0, [], []];
schema.TypeRegistry.for(_s).registerError(SESServiceException, SESServiceException$1);
var BouncedRecipientInfoList = [1, n0, _BRIL, 0, () => BouncedRecipientInfo];
var BulkEmailDestinationList = [1, n0, _BEDL, 0, () => BulkEmailDestination];
var BulkEmailDestinationStatusList = [1, n0, _BEDSL, 0, () => BulkEmailDestinationStatus];
var CloudWatchDimensionConfigurations = [
    1,
    n0,
    _CWDCl,
    0,
    () => CloudWatchDimensionConfiguration,
];
var ConfigurationSets = [1, n0, _CSo, 0, () => ConfigurationSet];
var CustomVerificationEmailTemplates = [
    1,
    n0,
    _CVETu,
    0,
    () => CustomVerificationEmailTemplate,
];
var EventDestinations = [1, n0, _EDv, 0, () => EventDestination];
var ExtensionFieldList = [1, n0, _EFL, 0, () => ExtensionField];
var MessageTagList = [1, n0, _MTL, 0, () => MessageTag];
var ReceiptActionsList = [1, n0, _RAL, 0, () => ReceiptAction];
var ReceiptFilterList = [1, n0, _RFL, 0, () => ReceiptFilter];
var ReceiptRuleSetsLists = [1, n0, _RRSL, 0, () => ReceiptRuleSetMetadata];
var ReceiptRulesList = [1, n0, _RRL, 0, () => ReceiptRule];
var SendDataPointList = [1, n0, _SDPL, 0, () => SendDataPoint];
var TemplateMetadataList = [1, n0, _TML, 0, () => TemplateMetadata];
var DkimAttributes = [2, n0, _DA, 0, 0, () => IdentityDkimAttributes];
var MailFromDomainAttributes = [2, n0, _MFDA, 0, 0, () => IdentityMailFromDomainAttributes];
var NotificationAttributes = [2, n0, _NA, 0, 0, () => IdentityNotificationAttributes];
var VerificationAttributes = [2, n0, _VA, 0, 0, () => IdentityVerificationAttributes];
var CloneReceiptRuleSet = [
    9,
    n0,
    _CRRS,
    0,
    () => CloneReceiptRuleSetRequest,
    () => CloneReceiptRuleSetResponse,
];
var CreateConfigurationSet = [
    9,
    n0,
    _CCS,
    0,
    () => CreateConfigurationSetRequest,
    () => CreateConfigurationSetResponse,
];
var CreateConfigurationSetEventDestination = [
    9,
    n0,
    _CCSED,
    0,
    () => CreateConfigurationSetEventDestinationRequest,
    () => CreateConfigurationSetEventDestinationResponse,
];
var CreateConfigurationSetTrackingOptions = [
    9,
    n0,
    _CCSTO,
    0,
    () => CreateConfigurationSetTrackingOptionsRequest,
    () => CreateConfigurationSetTrackingOptionsResponse,
];
var CreateCustomVerificationEmailTemplate = [
    9,
    n0,
    _CCVET,
    0,
    () => CreateCustomVerificationEmailTemplateRequest,
    () => __Unit,
];
var CreateReceiptFilter = [
    9,
    n0,
    _CRF,
    0,
    () => CreateReceiptFilterRequest,
    () => CreateReceiptFilterResponse,
];
var CreateReceiptRule = [
    9,
    n0,
    _CRR,
    0,
    () => CreateReceiptRuleRequest,
    () => CreateReceiptRuleResponse,
];
var CreateReceiptRuleSet = [
    9,
    n0,
    _CRRSr,
    0,
    () => CreateReceiptRuleSetRequest,
    () => CreateReceiptRuleSetResponse,
];
var CreateTemplate = [
    9,
    n0,
    _CTre,
    0,
    () => CreateTemplateRequest,
    () => CreateTemplateResponse,
];
var DeleteConfigurationSet = [
    9,
    n0,
    _DCS,
    0,
    () => DeleteConfigurationSetRequest,
    () => DeleteConfigurationSetResponse,
];
var DeleteConfigurationSetEventDestination = [
    9,
    n0,
    _DCSED,
    0,
    () => DeleteConfigurationSetEventDestinationRequest,
    () => DeleteConfigurationSetEventDestinationResponse,
];
var DeleteConfigurationSetTrackingOptions = [
    9,
    n0,
    _DCSTO,
    0,
    () => DeleteConfigurationSetTrackingOptionsRequest,
    () => DeleteConfigurationSetTrackingOptionsResponse,
];
var DeleteCustomVerificationEmailTemplate = [
    9,
    n0,
    _DCVET,
    0,
    () => DeleteCustomVerificationEmailTemplateRequest,
    () => __Unit,
];
var DeleteIdentity = [
    9,
    n0,
    _DI,
    0,
    () => DeleteIdentityRequest,
    () => DeleteIdentityResponse,
];
var DeleteIdentityPolicy = [
    9,
    n0,
    _DIP,
    0,
    () => DeleteIdentityPolicyRequest,
    () => DeleteIdentityPolicyResponse,
];
var DeleteReceiptFilter = [
    9,
    n0,
    _DRF,
    0,
    () => DeleteReceiptFilterRequest,
    () => DeleteReceiptFilterResponse,
];
var DeleteReceiptRule = [
    9,
    n0,
    _DRR,
    0,
    () => DeleteReceiptRuleRequest,
    () => DeleteReceiptRuleResponse,
];
var DeleteReceiptRuleSet = [
    9,
    n0,
    _DRRS,
    0,
    () => DeleteReceiptRuleSetRequest,
    () => DeleteReceiptRuleSetResponse,
];
var DeleteTemplate = [
    9,
    n0,
    _DTel,
    0,
    () => DeleteTemplateRequest,
    () => DeleteTemplateResponse,
];
var DeleteVerifiedEmailAddress = [
    9,
    n0,
    _DVEA,
    0,
    () => DeleteVerifiedEmailAddressRequest,
    () => __Unit,
];
var DescribeActiveReceiptRuleSet = [
    9,
    n0,
    _DARRS,
    0,
    () => DescribeActiveReceiptRuleSetRequest,
    () => DescribeActiveReceiptRuleSetResponse,
];
var DescribeConfigurationSet = [
    9,
    n0,
    _DCSe,
    0,
    () => DescribeConfigurationSetRequest,
    () => DescribeConfigurationSetResponse,
];
var DescribeReceiptRule = [
    9,
    n0,
    _DRRe,
    0,
    () => DescribeReceiptRuleRequest,
    () => DescribeReceiptRuleResponse,
];
var DescribeReceiptRuleSet = [
    9,
    n0,
    _DRRSe,
    0,
    () => DescribeReceiptRuleSetRequest,
    () => DescribeReceiptRuleSetResponse,
];
var GetAccountSendingEnabled = [
    9,
    n0,
    _GASE,
    0,
    () => __Unit,
    () => GetAccountSendingEnabledResponse,
];
var GetCustomVerificationEmailTemplate = [
    9,
    n0,
    _GCVET,
    0,
    () => GetCustomVerificationEmailTemplateRequest,
    () => GetCustomVerificationEmailTemplateResponse,
];
var GetIdentityDkimAttributes = [
    9,
    n0,
    _GIDA,
    0,
    () => GetIdentityDkimAttributesRequest,
    () => GetIdentityDkimAttributesResponse,
];
var GetIdentityMailFromDomainAttributes = [
    9,
    n0,
    _GIMFDA,
    0,
    () => GetIdentityMailFromDomainAttributesRequest,
    () => GetIdentityMailFromDomainAttributesResponse,
];
var GetIdentityNotificationAttributes = [
    9,
    n0,
    _GINA,
    0,
    () => GetIdentityNotificationAttributesRequest,
    () => GetIdentityNotificationAttributesResponse,
];
var GetIdentityPolicies = [
    9,
    n0,
    _GIP,
    0,
    () => GetIdentityPoliciesRequest,
    () => GetIdentityPoliciesResponse,
];
var GetIdentityVerificationAttributes = [
    9,
    n0,
    _GIVA,
    0,
    () => GetIdentityVerificationAttributesRequest,
    () => GetIdentityVerificationAttributesResponse,
];
var GetSendQuota = [9, n0, _GSQ, 0, () => __Unit, () => GetSendQuotaResponse];
var GetSendStatistics = [9, n0, _GSS, 0, () => __Unit, () => GetSendStatisticsResponse];
var GetTemplate = [9, n0, _GT, 0, () => GetTemplateRequest, () => GetTemplateResponse];
var ListConfigurationSets = [
    9,
    n0,
    _LCS,
    0,
    () => ListConfigurationSetsRequest,
    () => ListConfigurationSetsResponse,
];
var ListCustomVerificationEmailTemplates = [
    9,
    n0,
    _LCVET,
    0,
    () => ListCustomVerificationEmailTemplatesRequest,
    () => ListCustomVerificationEmailTemplatesResponse,
];
var ListIdentities = [
    9,
    n0,
    _LI,
    0,
    () => ListIdentitiesRequest,
    () => ListIdentitiesResponse,
];
var ListIdentityPolicies = [
    9,
    n0,
    _LIP,
    0,
    () => ListIdentityPoliciesRequest,
    () => ListIdentityPoliciesResponse,
];
var ListReceiptFilters = [
    9,
    n0,
    _LRF,
    0,
    () => ListReceiptFiltersRequest,
    () => ListReceiptFiltersResponse,
];
var ListReceiptRuleSets = [
    9,
    n0,
    _LRRS,
    0,
    () => ListReceiptRuleSetsRequest,
    () => ListReceiptRuleSetsResponse,
];
var ListTemplates = [
    9,
    n0,
    _LT,
    0,
    () => ListTemplatesRequest,
    () => ListTemplatesResponse,
];
var ListVerifiedEmailAddresses = [
    9,
    n0,
    _LVEA,
    0,
    () => __Unit,
    () => ListVerifiedEmailAddressesResponse,
];
var PutConfigurationSetDeliveryOptions = [
    9,
    n0,
    _PCSDO,
    0,
    () => PutConfigurationSetDeliveryOptionsRequest,
    () => PutConfigurationSetDeliveryOptionsResponse,
];
var PutIdentityPolicy = [
    9,
    n0,
    _PIP,
    0,
    () => PutIdentityPolicyRequest,
    () => PutIdentityPolicyResponse,
];
var ReorderReceiptRuleSet = [
    9,
    n0,
    _RRRS,
    0,
    () => ReorderReceiptRuleSetRequest,
    () => ReorderReceiptRuleSetResponse,
];
var SendBounce = [9, n0, _SB, 0, () => SendBounceRequest, () => SendBounceResponse];
var SendBulkTemplatedEmail = [
    9,
    n0,
    _SBTE,
    0,
    () => SendBulkTemplatedEmailRequest,
    () => SendBulkTemplatedEmailResponse,
];
var SendCustomVerificationEmail = [
    9,
    n0,
    _SCVE,
    0,
    () => SendCustomVerificationEmailRequest,
    () => SendCustomVerificationEmailResponse,
];
var SendEmail = [9, n0, _SEen, 0, () => SendEmailRequest, () => SendEmailResponse];
var SendRawEmail = [
    9,
    n0,
    _SRE,
    0,
    () => SendRawEmailRequest,
    () => SendRawEmailResponse,
];
var SendTemplatedEmail = [
    9,
    n0,
    _STE,
    0,
    () => SendTemplatedEmailRequest,
    () => SendTemplatedEmailResponse,
];
var SetActiveReceiptRuleSet = [
    9,
    n0,
    _SARRS,
    0,
    () => SetActiveReceiptRuleSetRequest,
    () => SetActiveReceiptRuleSetResponse,
];
var SetIdentityDkimEnabled = [
    9,
    n0,
    _SIDE,
    0,
    () => SetIdentityDkimEnabledRequest,
    () => SetIdentityDkimEnabledResponse,
];
var SetIdentityFeedbackForwardingEnabled = [
    9,
    n0,
    _SIFFE,
    0,
    () => SetIdentityFeedbackForwardingEnabledRequest,
    () => SetIdentityFeedbackForwardingEnabledResponse,
];
var SetIdentityHeadersInNotificationsEnabled = [
    9,
    n0,
    _SIHINE,
    0,
    () => SetIdentityHeadersInNotificationsEnabledRequest,
    () => SetIdentityHeadersInNotificationsEnabledResponse,
];
var SetIdentityMailFromDomain = [
    9,
    n0,
    _SIMFD,
    0,
    () => SetIdentityMailFromDomainRequest,
    () => SetIdentityMailFromDomainResponse,
];
var SetIdentityNotificationTopic = [
    9,
    n0,
    _SINT,
    0,
    () => SetIdentityNotificationTopicRequest,
    () => SetIdentityNotificationTopicResponse,
];
var SetReceiptRulePosition = [
    9,
    n0,
    _SRRP,
    0,
    () => SetReceiptRulePositionRequest,
    () => SetReceiptRulePositionResponse,
];
var TestRenderTemplate = [
    9,
    n0,
    _TRT,
    0,
    () => TestRenderTemplateRequest,
    () => TestRenderTemplateResponse,
];
var UpdateAccountSendingEnabled = [
    9,
    n0,
    _UASE,
    0,
    () => UpdateAccountSendingEnabledRequest,
    () => __Unit,
];
var UpdateConfigurationSetEventDestination = [
    9,
    n0,
    _UCSED,
    0,
    () => UpdateConfigurationSetEventDestinationRequest,
    () => UpdateConfigurationSetEventDestinationResponse,
];
var UpdateConfigurationSetReputationMetricsEnabled = [
    9,
    n0,
    _UCSRME,
    0,
    () => UpdateConfigurationSetReputationMetricsEnabledRequest,
    () => __Unit,
];
var UpdateConfigurationSetSendingEnabled = [
    9,
    n0,
    _UCSSE,
    0,
    () => UpdateConfigurationSetSendingEnabledRequest,
    () => __Unit,
];
var UpdateConfigurationSetTrackingOptions = [
    9,
    n0,
    _UCSTO,
    0,
    () => UpdateConfigurationSetTrackingOptionsRequest,
    () => UpdateConfigurationSetTrackingOptionsResponse,
];
var UpdateCustomVerificationEmailTemplate = [
    9,
    n0,
    _UCVET,
    0,
    () => UpdateCustomVerificationEmailTemplateRequest,
    () => __Unit,
];
var UpdateReceiptRule = [
    9,
    n0,
    _URR,
    0,
    () => UpdateReceiptRuleRequest,
    () => UpdateReceiptRuleResponse,
];
var UpdateTemplate = [
    9,
    n0,
    _UT,
    0,
    () => UpdateTemplateRequest,
    () => UpdateTemplateResponse,
];
var VerifyDomainDkim = [
    9,
    n0,
    _VDD,
    0,
    () => VerifyDomainDkimRequest,
    () => VerifyDomainDkimResponse,
];
var VerifyDomainIdentity = [
    9,
    n0,
    _VDI,
    0,
    () => VerifyDomainIdentityRequest,
    () => VerifyDomainIdentityResponse,
];
var VerifyEmailAddress = [9, n0, _VEAe, 0, () => VerifyEmailAddressRequest, () => __Unit];
var VerifyEmailIdentity = [
    9,
    n0,
    _VEI,
    0,
    () => VerifyEmailIdentityRequest,
    () => VerifyEmailIdentityResponse,
];

class CloneReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CloneReceiptRuleSet", {})
    .n("SESClient", "CloneReceiptRuleSetCommand")
    .sc(CloneReceiptRuleSet)
    .build() {
}

class CreateConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSet", {})
    .n("SESClient", "CreateConfigurationSetCommand")
    .sc(CreateConfigurationSet)
    .build() {
}

class CreateConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSetEventDestination", {})
    .n("SESClient", "CreateConfigurationSetEventDestinationCommand")
    .sc(CreateConfigurationSetEventDestination)
    .build() {
}

class CreateConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateConfigurationSetTrackingOptions", {})
    .n("SESClient", "CreateConfigurationSetTrackingOptionsCommand")
    .sc(CreateConfigurationSetTrackingOptions)
    .build() {
}

class CreateCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateCustomVerificationEmailTemplate", {})
    .n("SESClient", "CreateCustomVerificationEmailTemplateCommand")
    .sc(CreateCustomVerificationEmailTemplate)
    .build() {
}

class CreateReceiptFilterCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptFilter", {})
    .n("SESClient", "CreateReceiptFilterCommand")
    .sc(CreateReceiptFilter)
    .build() {
}

class CreateReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptRule", {})
    .n("SESClient", "CreateReceiptRuleCommand")
    .sc(CreateReceiptRule)
    .build() {
}

class CreateReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateReceiptRuleSet", {})
    .n("SESClient", "CreateReceiptRuleSetCommand")
    .sc(CreateReceiptRuleSet)
    .build() {
}

class CreateTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "CreateTemplate", {})
    .n("SESClient", "CreateTemplateCommand")
    .sc(CreateTemplate)
    .build() {
}

class DeleteConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSet", {})
    .n("SESClient", "DeleteConfigurationSetCommand")
    .sc(DeleteConfigurationSet)
    .build() {
}

class DeleteConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSetEventDestination", {})
    .n("SESClient", "DeleteConfigurationSetEventDestinationCommand")
    .sc(DeleteConfigurationSetEventDestination)
    .build() {
}

class DeleteConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteConfigurationSetTrackingOptions", {})
    .n("SESClient", "DeleteConfigurationSetTrackingOptionsCommand")
    .sc(DeleteConfigurationSetTrackingOptions)
    .build() {
}

class DeleteCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteCustomVerificationEmailTemplate", {})
    .n("SESClient", "DeleteCustomVerificationEmailTemplateCommand")
    .sc(DeleteCustomVerificationEmailTemplate)
    .build() {
}

class DeleteIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteIdentity", {})
    .n("SESClient", "DeleteIdentityCommand")
    .sc(DeleteIdentity)
    .build() {
}

class DeleteIdentityPolicyCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteIdentityPolicy", {})
    .n("SESClient", "DeleteIdentityPolicyCommand")
    .sc(DeleteIdentityPolicy)
    .build() {
}

class DeleteReceiptFilterCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptFilter", {})
    .n("SESClient", "DeleteReceiptFilterCommand")
    .sc(DeleteReceiptFilter)
    .build() {
}

class DeleteReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptRule", {})
    .n("SESClient", "DeleteReceiptRuleCommand")
    .sc(DeleteReceiptRule)
    .build() {
}

class DeleteReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteReceiptRuleSet", {})
    .n("SESClient", "DeleteReceiptRuleSetCommand")
    .sc(DeleteReceiptRuleSet)
    .build() {
}

class DeleteTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteTemplate", {})
    .n("SESClient", "DeleteTemplateCommand")
    .sc(DeleteTemplate)
    .build() {
}

class DeleteVerifiedEmailAddressCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DeleteVerifiedEmailAddress", {})
    .n("SESClient", "DeleteVerifiedEmailAddressCommand")
    .sc(DeleteVerifiedEmailAddress)
    .build() {
}

class DescribeActiveReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeActiveReceiptRuleSet", {})
    .n("SESClient", "DescribeActiveReceiptRuleSetCommand")
    .sc(DescribeActiveReceiptRuleSet)
    .build() {
}

class DescribeConfigurationSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeConfigurationSet", {})
    .n("SESClient", "DescribeConfigurationSetCommand")
    .sc(DescribeConfigurationSet)
    .build() {
}

class DescribeReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeReceiptRule", {})
    .n("SESClient", "DescribeReceiptRuleCommand")
    .sc(DescribeReceiptRule)
    .build() {
}

class DescribeReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "DescribeReceiptRuleSet", {})
    .n("SESClient", "DescribeReceiptRuleSetCommand")
    .sc(DescribeReceiptRuleSet)
    .build() {
}

class GetAccountSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetAccountSendingEnabled", {})
    .n("SESClient", "GetAccountSendingEnabledCommand")
    .sc(GetAccountSendingEnabled)
    .build() {
}

class GetCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetCustomVerificationEmailTemplate", {})
    .n("SESClient", "GetCustomVerificationEmailTemplateCommand")
    .sc(GetCustomVerificationEmailTemplate)
    .build() {
}

class GetIdentityDkimAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityDkimAttributes", {})
    .n("SESClient", "GetIdentityDkimAttributesCommand")
    .sc(GetIdentityDkimAttributes)
    .build() {
}

class GetIdentityMailFromDomainAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityMailFromDomainAttributes", {})
    .n("SESClient", "GetIdentityMailFromDomainAttributesCommand")
    .sc(GetIdentityMailFromDomainAttributes)
    .build() {
}

class GetIdentityNotificationAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityNotificationAttributes", {})
    .n("SESClient", "GetIdentityNotificationAttributesCommand")
    .sc(GetIdentityNotificationAttributes)
    .build() {
}

class GetIdentityPoliciesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityPolicies", {})
    .n("SESClient", "GetIdentityPoliciesCommand")
    .sc(GetIdentityPolicies)
    .build() {
}

class GetIdentityVerificationAttributesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetIdentityVerificationAttributes", {})
    .n("SESClient", "GetIdentityVerificationAttributesCommand")
    .sc(GetIdentityVerificationAttributes)
    .build() {
}

class GetSendQuotaCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetSendQuota", {})
    .n("SESClient", "GetSendQuotaCommand")
    .sc(GetSendQuota)
    .build() {
}

class GetSendStatisticsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetSendStatistics", {})
    .n("SESClient", "GetSendStatisticsCommand")
    .sc(GetSendStatistics)
    .build() {
}

class GetTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "GetTemplate", {})
    .n("SESClient", "GetTemplateCommand")
    .sc(GetTemplate)
    .build() {
}

class ListConfigurationSetsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListConfigurationSets", {})
    .n("SESClient", "ListConfigurationSetsCommand")
    .sc(ListConfigurationSets)
    .build() {
}

class ListCustomVerificationEmailTemplatesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListCustomVerificationEmailTemplates", {})
    .n("SESClient", "ListCustomVerificationEmailTemplatesCommand")
    .sc(ListCustomVerificationEmailTemplates)
    .build() {
}

class ListIdentitiesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListIdentities", {})
    .n("SESClient", "ListIdentitiesCommand")
    .sc(ListIdentities)
    .build() {
}

class ListIdentityPoliciesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListIdentityPolicies", {})
    .n("SESClient", "ListIdentityPoliciesCommand")
    .sc(ListIdentityPolicies)
    .build() {
}

class ListReceiptFiltersCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListReceiptFilters", {})
    .n("SESClient", "ListReceiptFiltersCommand")
    .sc(ListReceiptFilters)
    .build() {
}

class ListReceiptRuleSetsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListReceiptRuleSets", {})
    .n("SESClient", "ListReceiptRuleSetsCommand")
    .sc(ListReceiptRuleSets)
    .build() {
}

class ListTemplatesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListTemplates", {})
    .n("SESClient", "ListTemplatesCommand")
    .sc(ListTemplates)
    .build() {
}

class ListVerifiedEmailAddressesCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ListVerifiedEmailAddresses", {})
    .n("SESClient", "ListVerifiedEmailAddressesCommand")
    .sc(ListVerifiedEmailAddresses)
    .build() {
}

class PutConfigurationSetDeliveryOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "PutConfigurationSetDeliveryOptions", {})
    .n("SESClient", "PutConfigurationSetDeliveryOptionsCommand")
    .sc(PutConfigurationSetDeliveryOptions)
    .build() {
}

class PutIdentityPolicyCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "PutIdentityPolicy", {})
    .n("SESClient", "PutIdentityPolicyCommand")
    .sc(PutIdentityPolicy)
    .build() {
}

class ReorderReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "ReorderReceiptRuleSet", {})
    .n("SESClient", "ReorderReceiptRuleSetCommand")
    .sc(ReorderReceiptRuleSet)
    .build() {
}

class SendBounceCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendBounce", {})
    .n("SESClient", "SendBounceCommand")
    .sc(SendBounce)
    .build() {
}

class SendBulkTemplatedEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendBulkTemplatedEmail", {})
    .n("SESClient", "SendBulkTemplatedEmailCommand")
    .sc(SendBulkTemplatedEmail)
    .build() {
}

class SendCustomVerificationEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendCustomVerificationEmail", {})
    .n("SESClient", "SendCustomVerificationEmailCommand")
    .sc(SendCustomVerificationEmail)
    .build() {
}

class SendEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendEmail", {})
    .n("SESClient", "SendEmailCommand")
    .sc(SendEmail)
    .build() {
}

class SendRawEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendRawEmail", {})
    .n("SESClient", "SendRawEmailCommand")
    .sc(SendRawEmail)
    .build() {
}

class SendTemplatedEmailCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SendTemplatedEmail", {})
    .n("SESClient", "SendTemplatedEmailCommand")
    .sc(SendTemplatedEmail)
    .build() {
}

class SetActiveReceiptRuleSetCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetActiveReceiptRuleSet", {})
    .n("SESClient", "SetActiveReceiptRuleSetCommand")
    .sc(SetActiveReceiptRuleSet)
    .build() {
}

class SetIdentityDkimEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityDkimEnabled", {})
    .n("SESClient", "SetIdentityDkimEnabledCommand")
    .sc(SetIdentityDkimEnabled)
    .build() {
}

class SetIdentityFeedbackForwardingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityFeedbackForwardingEnabled", {})
    .n("SESClient", "SetIdentityFeedbackForwardingEnabledCommand")
    .sc(SetIdentityFeedbackForwardingEnabled)
    .build() {
}

class SetIdentityHeadersInNotificationsEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityHeadersInNotificationsEnabled", {})
    .n("SESClient", "SetIdentityHeadersInNotificationsEnabledCommand")
    .sc(SetIdentityHeadersInNotificationsEnabled)
    .build() {
}

class SetIdentityMailFromDomainCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityMailFromDomain", {})
    .n("SESClient", "SetIdentityMailFromDomainCommand")
    .sc(SetIdentityMailFromDomain)
    .build() {
}

class SetIdentityNotificationTopicCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetIdentityNotificationTopic", {})
    .n("SESClient", "SetIdentityNotificationTopicCommand")
    .sc(SetIdentityNotificationTopic)
    .build() {
}

class SetReceiptRulePositionCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "SetReceiptRulePosition", {})
    .n("SESClient", "SetReceiptRulePositionCommand")
    .sc(SetReceiptRulePosition)
    .build() {
}

class TestRenderTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "TestRenderTemplate", {})
    .n("SESClient", "TestRenderTemplateCommand")
    .sc(TestRenderTemplate)
    .build() {
}

class UpdateAccountSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateAccountSendingEnabled", {})
    .n("SESClient", "UpdateAccountSendingEnabledCommand")
    .sc(UpdateAccountSendingEnabled)
    .build() {
}

class UpdateConfigurationSetEventDestinationCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetEventDestination", {})
    .n("SESClient", "UpdateConfigurationSetEventDestinationCommand")
    .sc(UpdateConfigurationSetEventDestination)
    .build() {
}

class UpdateConfigurationSetReputationMetricsEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetReputationMetricsEnabled", {})
    .n("SESClient", "UpdateConfigurationSetReputationMetricsEnabledCommand")
    .sc(UpdateConfigurationSetReputationMetricsEnabled)
    .build() {
}

class UpdateConfigurationSetSendingEnabledCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetSendingEnabled", {})
    .n("SESClient", "UpdateConfigurationSetSendingEnabledCommand")
    .sc(UpdateConfigurationSetSendingEnabled)
    .build() {
}

class UpdateConfigurationSetTrackingOptionsCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateConfigurationSetTrackingOptions", {})
    .n("SESClient", "UpdateConfigurationSetTrackingOptionsCommand")
    .sc(UpdateConfigurationSetTrackingOptions)
    .build() {
}

class UpdateCustomVerificationEmailTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateCustomVerificationEmailTemplate", {})
    .n("SESClient", "UpdateCustomVerificationEmailTemplateCommand")
    .sc(UpdateCustomVerificationEmailTemplate)
    .build() {
}

class UpdateReceiptRuleCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateReceiptRule", {})
    .n("SESClient", "UpdateReceiptRuleCommand")
    .sc(UpdateReceiptRule)
    .build() {
}

class UpdateTemplateCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "UpdateTemplate", {})
    .n("SESClient", "UpdateTemplateCommand")
    .sc(UpdateTemplate)
    .build() {
}

class VerifyDomainDkimCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyDomainDkim", {})
    .n("SESClient", "VerifyDomainDkimCommand")
    .sc(VerifyDomainDkim)
    .build() {
}

class VerifyDomainIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyDomainIdentity", {})
    .n("SESClient", "VerifyDomainIdentityCommand")
    .sc(VerifyDomainIdentity)
    .build() {
}

class VerifyEmailAddressCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyEmailAddress", {})
    .n("SESClient", "VerifyEmailAddressCommand")
    .sc(VerifyEmailAddress)
    .build() {
}

class VerifyEmailIdentityCommand extends smithyClient.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [middlewareEndpoint.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SimpleEmailService", "VerifyEmailIdentity", {})
    .n("SESClient", "VerifyEmailIdentityCommand")
    .sc(VerifyEmailIdentity)
    .build() {
}

const commands = {
    CloneReceiptRuleSetCommand,
    CreateConfigurationSetCommand,
    CreateConfigurationSetEventDestinationCommand,
    CreateConfigurationSetTrackingOptionsCommand,
    CreateCustomVerificationEmailTemplateCommand,
    CreateReceiptFilterCommand,
    CreateReceiptRuleCommand,
    CreateReceiptRuleSetCommand,
    CreateTemplateCommand,
    DeleteConfigurationSetCommand,
    DeleteConfigurationSetEventDestinationCommand,
    DeleteConfigurationSetTrackingOptionsCommand,
    DeleteCustomVerificationEmailTemplateCommand,
    DeleteIdentityCommand,
    DeleteIdentityPolicyCommand,
    DeleteReceiptFilterCommand,
    DeleteReceiptRuleCommand,
    DeleteReceiptRuleSetCommand,
    DeleteTemplateCommand,
    DeleteVerifiedEmailAddressCommand,
    DescribeActiveReceiptRuleSetCommand,
    DescribeConfigurationSetCommand,
    DescribeReceiptRuleCommand,
    DescribeReceiptRuleSetCommand,
    GetAccountSendingEnabledCommand,
    GetCustomVerificationEmailTemplateCommand,
    GetIdentityDkimAttributesCommand,
    GetIdentityMailFromDomainAttributesCommand,
    GetIdentityNotificationAttributesCommand,
    GetIdentityPoliciesCommand,
    GetIdentityVerificationAttributesCommand,
    GetSendQuotaCommand,
    GetSendStatisticsCommand,
    GetTemplateCommand,
    ListConfigurationSetsCommand,
    ListCustomVerificationEmailTemplatesCommand,
    ListIdentitiesCommand,
    ListIdentityPoliciesCommand,
    ListReceiptFiltersCommand,
    ListReceiptRuleSetsCommand,
    ListTemplatesCommand,
    ListVerifiedEmailAddressesCommand,
    PutConfigurationSetDeliveryOptionsCommand,
    PutIdentityPolicyCommand,
    ReorderReceiptRuleSetCommand,
    SendBounceCommand,
    SendBulkTemplatedEmailCommand,
    SendCustomVerificationEmailCommand,
    SendEmailCommand,
    SendRawEmailCommand,
    SendTemplatedEmailCommand,
    SetActiveReceiptRuleSetCommand,
    SetIdentityDkimEnabledCommand,
    SetIdentityFeedbackForwardingEnabledCommand,
    SetIdentityHeadersInNotificationsEnabledCommand,
    SetIdentityMailFromDomainCommand,
    SetIdentityNotificationTopicCommand,
    SetReceiptRulePositionCommand,
    TestRenderTemplateCommand,
    UpdateAccountSendingEnabledCommand,
    UpdateConfigurationSetEventDestinationCommand,
    UpdateConfigurationSetReputationMetricsEnabledCommand,
    UpdateConfigurationSetSendingEnabledCommand,
    UpdateConfigurationSetTrackingOptionsCommand,
    UpdateCustomVerificationEmailTemplateCommand,
    UpdateReceiptRuleCommand,
    UpdateTemplateCommand,
    VerifyDomainDkimCommand,
    VerifyDomainIdentityCommand,
    VerifyEmailAddressCommand,
    VerifyEmailIdentityCommand,
};
class SES extends SESClient {
}
smithyClient.createAggregatedClient(commands, SES);

const paginateListCustomVerificationEmailTemplates = core.createPaginator(SESClient, ListCustomVerificationEmailTemplatesCommand, "NextToken", "NextToken", "MaxResults");

const paginateListIdentities = core.createPaginator(SESClient, ListIdentitiesCommand, "NextToken", "NextToken", "MaxItems");

const checkState = async (client, input) => {
    let reason;
    try {
        const result = await client.send(new GetIdentityVerificationAttributesCommand(input));
        reason = result;
        try {
            const returnComparator = () => {
                const objectProjection_2 = Object.values(result.VerificationAttributes).map((element_1) => {
                    return element_1.VerificationStatus;
                });
                return objectProjection_2;
            };
            let allStringEq_4 = returnComparator().length > 0;
            for (const element_3 of returnComparator()) {
                allStringEq_4 = allStringEq_4 && element_3 == "Success";
            }
            if (allStringEq_4) {
                return { state: utilWaiter.WaiterState.SUCCESS, reason };
            }
        }
        catch (e) { }
    }
    catch (exception) {
        reason = exception;
    }
    return { state: utilWaiter.WaiterState.RETRY, reason };
};
const waitForIdentityExists = async (params, input) => {
    const serviceDefaults = { minDelay: 3, maxDelay: 120 };
    return utilWaiter.createWaiter({ ...serviceDefaults, ...params }, input, checkState);
};
const waitUntilIdentityExists = async (params, input) => {
    const serviceDefaults = { minDelay: 3, maxDelay: 120 };
    const result = await utilWaiter.createWaiter({ ...serviceDefaults, ...params }, input, checkState);
    return utilWaiter.checkExceptions(result);
};

const BehaviorOnMXFailure = {
    RejectMessage: "RejectMessage",
    UseDefaultValue: "UseDefaultValue",
};
const BounceType = {
    ContentRejected: "ContentRejected",
    DoesNotExist: "DoesNotExist",
    ExceededQuota: "ExceededQuota",
    MessageTooLarge: "MessageTooLarge",
    TemporaryFailure: "TemporaryFailure",
    Undefined: "Undefined",
};
const DsnAction = {
    DELAYED: "delayed",
    DELIVERED: "delivered",
    EXPANDED: "expanded",
    FAILED: "failed",
    RELAYED: "relayed",
};
const BulkEmailStatus = {
    AccountDailyQuotaExceeded: "AccountDailyQuotaExceeded",
    AccountSendingPaused: "AccountSendingPaused",
    AccountSuspended: "AccountSuspended",
    AccountThrottled: "AccountThrottled",
    ConfigurationSetDoesNotExist: "ConfigurationSetDoesNotExist",
    ConfigurationSetSendingPaused: "ConfigurationSetSendingPaused",
    Failed: "Failed",
    InvalidParameterValue: "InvalidParameterValue",
    InvalidSendingPoolName: "InvalidSendingPoolName",
    MailFromDomainNotVerified: "MailFromDomainNotVerified",
    MessageRejected: "MessageRejected",
    Success: "Success",
    TemplateDoesNotExist: "TemplateDoesNotExist",
    TransientFailure: "TransientFailure",
};
const DimensionValueSource = {
    EMAIL_HEADER: "emailHeader",
    LINK_TAG: "linkTag",
    MESSAGE_TAG: "messageTag",
};
const ConfigurationSetAttribute = {
    DELIVERY_OPTIONS: "deliveryOptions",
    EVENT_DESTINATIONS: "eventDestinations",
    REPUTATION_OPTIONS: "reputationOptions",
    TRACKING_OPTIONS: "trackingOptions",
};
const EventType = {
    BOUNCE: "bounce",
    CLICK: "click",
    COMPLAINT: "complaint",
    DELIVERY: "delivery",
    OPEN: "open",
    REJECT: "reject",
    RENDERING_FAILURE: "renderingFailure",
    SEND: "send",
};
const ReceiptFilterPolicy = {
    Allow: "Allow",
    Block: "Block",
};
const InvocationType = {
    Event: "Event",
    RequestResponse: "RequestResponse",
};
const SNSActionEncoding = {
    Base64: "Base64",
    UTF8: "UTF-8",
};
const StopScope = {
    RULE_SET: "RuleSet",
};
const TlsPolicy = {
    Optional: "Optional",
    Require: "Require",
};
const CustomMailFromStatus = {
    Failed: "Failed",
    Pending: "Pending",
    Success: "Success",
    TemporaryFailure: "TemporaryFailure",
};
const VerificationStatus = {
    Failed: "Failed",
    NotStarted: "NotStarted",
    Pending: "Pending",
    Success: "Success",
    TemporaryFailure: "TemporaryFailure",
};
const IdentityType = {
    Domain: "Domain",
    EmailAddress: "EmailAddress",
};
const NotificationType = {
    Bounce: "Bounce",
    Complaint: "Complaint",
    Delivery: "Delivery",
};

Object.defineProperty(exports, "$Command", {
    enumerable: true,
    get: function () { return smithyClient.Command; }
});
Object.defineProperty(exports, "__Client", {
    enumerable: true,
    get: function () { return smithyClient.Client; }
});
exports.AccountSendingPausedException = AccountSendingPausedException$1;
exports.AlreadyExistsException = AlreadyExistsException$1;
exports.BehaviorOnMXFailure = BehaviorOnMXFailure;
exports.BounceType = BounceType;
exports.BulkEmailStatus = BulkEmailStatus;
exports.CannotDeleteException = CannotDeleteException$1;
exports.CloneReceiptRuleSetCommand = CloneReceiptRuleSetCommand;
exports.ConfigurationSetAlreadyExistsException = ConfigurationSetAlreadyExistsException$1;
exports.ConfigurationSetAttribute = ConfigurationSetAttribute;
exports.ConfigurationSetDoesNotExistException = ConfigurationSetDoesNotExistException$1;
exports.ConfigurationSetSendingPausedException = ConfigurationSetSendingPausedException$1;
exports.CreateConfigurationSetCommand = CreateConfigurationSetCommand;
exports.CreateConfigurationSetEventDestinationCommand = CreateConfigurationSetEventDestinationCommand;
exports.CreateConfigurationSetTrackingOptionsCommand = CreateConfigurationSetTrackingOptionsCommand;
exports.CreateCustomVerificationEmailTemplateCommand = CreateCustomVerificationEmailTemplateCommand;
exports.CreateReceiptFilterCommand = CreateReceiptFilterCommand;
exports.CreateReceiptRuleCommand = CreateReceiptRuleCommand;
exports.CreateReceiptRuleSetCommand = CreateReceiptRuleSetCommand;
exports.CreateTemplateCommand = CreateTemplateCommand;
exports.CustomMailFromStatus = CustomMailFromStatus;
exports.CustomVerificationEmailInvalidContentException = CustomVerificationEmailInvalidContentException$1;
exports.CustomVerificationEmailTemplateAlreadyExistsException = CustomVerificationEmailTemplateAlreadyExistsException$1;
exports.CustomVerificationEmailTemplateDoesNotExistException = CustomVerificationEmailTemplateDoesNotExistException$1;
exports.DeleteConfigurationSetCommand = DeleteConfigurationSetCommand;
exports.DeleteConfigurationSetEventDestinationCommand = DeleteConfigurationSetEventDestinationCommand;
exports.DeleteConfigurationSetTrackingOptionsCommand = DeleteConfigurationSetTrackingOptionsCommand;
exports.DeleteCustomVerificationEmailTemplateCommand = DeleteCustomVerificationEmailTemplateCommand;
exports.DeleteIdentityCommand = DeleteIdentityCommand;
exports.DeleteIdentityPolicyCommand = DeleteIdentityPolicyCommand;
exports.DeleteReceiptFilterCommand = DeleteReceiptFilterCommand;
exports.DeleteReceiptRuleCommand = DeleteReceiptRuleCommand;
exports.DeleteReceiptRuleSetCommand = DeleteReceiptRuleSetCommand;
exports.DeleteTemplateCommand = DeleteTemplateCommand;
exports.DeleteVerifiedEmailAddressCommand = DeleteVerifiedEmailAddressCommand;
exports.DescribeActiveReceiptRuleSetCommand = DescribeActiveReceiptRuleSetCommand;
exports.DescribeConfigurationSetCommand = DescribeConfigurationSetCommand;
exports.DescribeReceiptRuleCommand = DescribeReceiptRuleCommand;
exports.DescribeReceiptRuleSetCommand = DescribeReceiptRuleSetCommand;
exports.DimensionValueSource = DimensionValueSource;
exports.DsnAction = DsnAction;
exports.EventDestinationAlreadyExistsException = EventDestinationAlreadyExistsException$1;
exports.EventDestinationDoesNotExistException = EventDestinationDoesNotExistException$1;
exports.EventType = EventType;
exports.FromEmailAddressNotVerifiedException = FromEmailAddressNotVerifiedException$1;
exports.GetAccountSendingEnabledCommand = GetAccountSendingEnabledCommand;
exports.GetCustomVerificationEmailTemplateCommand = GetCustomVerificationEmailTemplateCommand;
exports.GetIdentityDkimAttributesCommand = GetIdentityDkimAttributesCommand;
exports.GetIdentityMailFromDomainAttributesCommand = GetIdentityMailFromDomainAttributesCommand;
exports.GetIdentityNotificationAttributesCommand = GetIdentityNotificationAttributesCommand;
exports.GetIdentityPoliciesCommand = GetIdentityPoliciesCommand;
exports.GetIdentityVerificationAttributesCommand = GetIdentityVerificationAttributesCommand;
exports.GetSendQuotaCommand = GetSendQuotaCommand;
exports.GetSendStatisticsCommand = GetSendStatisticsCommand;
exports.GetTemplateCommand = GetTemplateCommand;
exports.IdentityType = IdentityType;
exports.InvalidCloudWatchDestinationException = InvalidCloudWatchDestinationException$1;
exports.InvalidConfigurationSetException = InvalidConfigurationSetException$1;
exports.InvalidDeliveryOptionsException = InvalidDeliveryOptionsException$1;
exports.InvalidFirehoseDestinationException = InvalidFirehoseDestinationException$1;
exports.InvalidLambdaFunctionException = InvalidLambdaFunctionException$1;
exports.InvalidPolicyException = InvalidPolicyException$1;
exports.InvalidRenderingParameterException = InvalidRenderingParameterException$1;
exports.InvalidS3ConfigurationException = InvalidS3ConfigurationException$1;
exports.InvalidSNSDestinationException = InvalidSNSDestinationException$1;
exports.InvalidSnsTopicException = InvalidSnsTopicException$1;
exports.InvalidTemplateException = InvalidTemplateException$1;
exports.InvalidTrackingOptionsException = InvalidTrackingOptionsException$1;
exports.InvocationType = InvocationType;
exports.LimitExceededException = LimitExceededException$1;
exports.ListConfigurationSetsCommand = ListConfigurationSetsCommand;
exports.ListCustomVerificationEmailTemplatesCommand = ListCustomVerificationEmailTemplatesCommand;
exports.ListIdentitiesCommand = ListIdentitiesCommand;
exports.ListIdentityPoliciesCommand = ListIdentityPoliciesCommand;
exports.ListReceiptFiltersCommand = ListReceiptFiltersCommand;
exports.ListReceiptRuleSetsCommand = ListReceiptRuleSetsCommand;
exports.ListTemplatesCommand = ListTemplatesCommand;
exports.ListVerifiedEmailAddressesCommand = ListVerifiedEmailAddressesCommand;
exports.MailFromDomainNotVerifiedException = MailFromDomainNotVerifiedException$1;
exports.MessageRejected = MessageRejected$1;
exports.MissingRenderingAttributeException = MissingRenderingAttributeException$1;
exports.NotificationType = NotificationType;
exports.ProductionAccessNotGrantedException = ProductionAccessNotGrantedException$1;
exports.PutConfigurationSetDeliveryOptionsCommand = PutConfigurationSetDeliveryOptionsCommand;
exports.PutIdentityPolicyCommand = PutIdentityPolicyCommand;
exports.ReceiptFilterPolicy = ReceiptFilterPolicy;
exports.ReorderReceiptRuleSetCommand = ReorderReceiptRuleSetCommand;
exports.RuleDoesNotExistException = RuleDoesNotExistException$1;
exports.RuleSetDoesNotExistException = RuleSetDoesNotExistException$1;
exports.SES = SES;
exports.SESClient = SESClient;
exports.SESServiceException = SESServiceException$1;
exports.SNSActionEncoding = SNSActionEncoding;
exports.SendBounceCommand = SendBounceCommand;
exports.SendBulkTemplatedEmailCommand = SendBulkTemplatedEmailCommand;
exports.SendCustomVerificationEmailCommand = SendCustomVerificationEmailCommand;
exports.SendEmailCommand = SendEmailCommand;
exports.SendRawEmailCommand = SendRawEmailCommand;
exports.SendTemplatedEmailCommand = SendTemplatedEmailCommand;
exports.SetActiveReceiptRuleSetCommand = SetActiveReceiptRuleSetCommand;
exports.SetIdentityDkimEnabledCommand = SetIdentityDkimEnabledCommand;
exports.SetIdentityFeedbackForwardingEnabledCommand = SetIdentityFeedbackForwardingEnabledCommand;
exports.SetIdentityHeadersInNotificationsEnabledCommand = SetIdentityHeadersInNotificationsEnabledCommand;
exports.SetIdentityMailFromDomainCommand = SetIdentityMailFromDomainCommand;
exports.SetIdentityNotificationTopicCommand = SetIdentityNotificationTopicCommand;
exports.SetReceiptRulePositionCommand = SetReceiptRulePositionCommand;
exports.StopScope = StopScope;
exports.TemplateDoesNotExistException = TemplateDoesNotExistException$1;
exports.TestRenderTemplateCommand = TestRenderTemplateCommand;
exports.TlsPolicy = TlsPolicy;
exports.TrackingOptionsAlreadyExistsException = TrackingOptionsAlreadyExistsException$1;
exports.TrackingOptionsDoesNotExistException = TrackingOptionsDoesNotExistException$1;
exports.UpdateAccountSendingEnabledCommand = UpdateAccountSendingEnabledCommand;
exports.UpdateConfigurationSetEventDestinationCommand = UpdateConfigurationSetEventDestinationCommand;
exports.UpdateConfigurationSetReputationMetricsEnabledCommand = UpdateConfigurationSetReputationMetricsEnabledCommand;
exports.UpdateConfigurationSetSendingEnabledCommand = UpdateConfigurationSetSendingEnabledCommand;
exports.UpdateConfigurationSetTrackingOptionsCommand = UpdateConfigurationSetTrackingOptionsCommand;
exports.UpdateCustomVerificationEmailTemplateCommand = UpdateCustomVerificationEmailTemplateCommand;
exports.UpdateReceiptRuleCommand = UpdateReceiptRuleCommand;
exports.UpdateTemplateCommand = UpdateTemplateCommand;
exports.VerificationStatus = VerificationStatus;
exports.VerifyDomainDkimCommand = VerifyDomainDkimCommand;
exports.VerifyDomainIdentityCommand = VerifyDomainIdentityCommand;
exports.VerifyEmailAddressCommand = VerifyEmailAddressCommand;
exports.VerifyEmailIdentityCommand = VerifyEmailIdentityCommand;
exports.paginateListCustomVerificationEmailTemplates = paginateListCustomVerificationEmailTemplates;
exports.paginateListIdentities = paginateListIdentities;
exports.waitForIdentityExists = waitForIdentityExists;
exports.waitUntilIdentityExists = waitUntilIdentityExists;
