"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'tallal-test/4.0.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Use this API to explore a collection's metadata and statistics (sales, volume, etc).
     *
     * @summary Collections
     */
    SDK.prototype.getCollections = function (body) {
        return this.core.fetch('/collections', 'post', body);
    };
    /**
     * Use this API to do a fuzzy collection search
     *
     * @summary Search Collections
     */
    SDK.prototype.searchCollections = function (body) {
        return this.core.fetch('/collections/search', 'post', body);
    };
    /**
     * Use this API to explore a user's collections metadata and statistics (sales, volume,
     * etc).
     *
     * @summary User Collections
     */
    SDK.prototype.getUserCollections = function (body) {
        return this.core.fetch('/collections/user-collections', 'post', body);
    };
    /**
     * Use this API to explore a collection's assets and its market info
     *
     * @summary Collection Assets
     */
    SDK.prototype.getAssets = function (metadata) {
        return this.core.fetch('/assets/collection-assets', 'get', metadata);
    };
    /**
     * Use this API to explore a user's assets and its market info
     *
     * @summary User Assets
     */
    SDK.prototype.getUserAssets = function (metadata) {
        return this.core.fetch('/assets/user-assets', 'get', metadata);
    };
    /**
     * Use this API to search asks
     *
     * @summary Asks (listings)
     */
    SDK.prototype.getAsks = function (metadata) {
        return this.core.fetch('/orders/asks', 'get', metadata);
    };
    /**
     * Use this API to search bids
     *
     * @summary Bids (offers)
     */
    SDK.prototype.getBids = function (metadata) {
        return this.core.fetch('/orders/bids', 'get', metadata);
    };
    /**
     * Use this API to get NFT activity
     *
     * @summary NFT Activity
     */
    SDK.prototype.getNftActivity = function (metadata) {
        return this.core.fetch('/activities', 'get', metadata);
    };
    /**
     * Generate listings for assets (tokens). This API is used to generate listing data to
     * sign. Once you get signing data from this API, you shall sign them and post to another
     * listing creation API to finish listing generation
     *
     * @summary Create Listings (Get Signing Data)
     */
    SDK.prototype.ixsListGet = function (body) {
        return this.core.fetch('/ixs/list/get', 'post', body);
    };
    /**
     * Generate listings for assets (tokens). This API is used to create listings with
     * signature provided
     *
     * @summary Create Listings (Creation)
     */
    SDK.prototype.ixsListPost = function (body) {
        return this.core.fetch('/ixs/list', 'post', body);
    };
    /**
     * Generate bids. This API is used to generate bid data to sign. Once you get signing data
     * from this API, you shall sign them and post to another bid creation API to finish bid
     * generation
     *
     * @summary Create Bids (Get Signing Data)
     */
    SDK.prototype.ixsBidGet = function (body) {
        return this.core.fetch('/ixs/bid/get', 'post', body);
    };
    /**
     * Generate bids. This API is used to create bids with signature provided
     *
     * @summary Create Bids (Creation)
     */
    SDK.prototype.ixsBidPost = function (body) {
        return this.core.fetch('/ixs/bid', 'post', body);
    };
    /**
     * Cancel Orders. This API is used to generate order cancellation data to sign. Once you
     * get signing data from this API, you shall sign them and post to another order
     * cancellation API to finish order cancellation
     *
     * @summary Cancel Orders (Get Signing Data)
     */
    SDK.prototype.ixsCancelOrderGet = function (body) {
        return this.core.fetch('/ixs/cancel-order/get', 'post', body);
    };
    /**
     * Cancel Orders. This API is used to cancel orders with signature provided
     *
     * @summary Cancel Orders (Cancellation)
     */
    SDK.prototype.ixsCancelOrderPost = function (body) {
        return this.core.fetch('/ixs/cancel-order', 'post', body);
    };
    /**
     * Bulk transfer assets(tokens). This API is used to generate asset bulk transfer
     * transaction data
     *
     * @summary Bulk Transfer
     */
    SDK.prototype.ixsBulkTransferGet = function (body) {
        return this.core.fetch('/ixs/bulk-transfer/get', 'post', body);
    };
    /**
     * Buy assets(tokens). This API is used to generate transaction data to buy assets
     *
     * @summary Buy Assets
     */
    SDK.prototype.ixsBuyGet = function (body) {
        return this.core.fetch('/ixs/buy/get', 'post', body);
    };
    /**
     * Sell assets(tokens). This API is used to generate transaction data to sell assets
     *
     * @summary Sell Assets
     */
    SDK.prototype.ixsSellGet = function (body) {
        return this.core.fetch('/ixs/sell/get', 'post', body);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
