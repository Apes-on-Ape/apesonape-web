import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
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
    auth(...values: string[] | number[]): this;
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
    server(url: string, variables?: {}): void;
    /**
     * Use this API to explore a collection's metadata and statistics (sales, volume, etc).
     *
     * @summary Collections
     */
    getCollections(body: types.GetCollectionsBodyParam): Promise<FetchResponse<200, types.GetCollectionsResponse200>>;
    /**
     * Use this API to do a fuzzy collection search
     *
     * @summary Search Collections
     */
    searchCollections(body: types.SearchCollectionsBodyParam): Promise<FetchResponse<200, types.SearchCollectionsResponse200>>;
    /**
     * Use this API to explore a user's collections metadata and statistics (sales, volume,
     * etc).
     *
     * @summary User Collections
     */
    getUserCollections(body: types.GetUserCollectionsBodyParam): Promise<FetchResponse<200, types.GetUserCollectionsResponse200>>;
    /**
     * Use this API to explore a collection's assets and its market info
     *
     * @summary Collection Assets
     */
    getAssets(metadata: types.GetAssetsMetadataParam): Promise<FetchResponse<200, types.GetAssetsResponse200>>;
    /**
     * Use this API to explore a user's assets and its market info
     *
     * @summary User Assets
     */
    getUserAssets(metadata: types.GetUserAssetsMetadataParam): Promise<FetchResponse<200, types.GetUserAssetsResponse200>>;
    /**
     * Use this API to search asks
     *
     * @summary Asks (listings)
     */
    getAsks(metadata: types.GetAsksMetadataParam): Promise<FetchResponse<200, types.GetAsksResponse200>>;
    /**
     * Use this API to search bids
     *
     * @summary Bids (offers)
     */
    getBids(metadata: types.GetBidsMetadataParam): Promise<FetchResponse<200, types.GetBidsResponse200>>;
    /**
     * Use this API to get NFT activity
     *
     * @summary NFT Activity
     */
    getNftActivity(metadata: types.GetNftActivityMetadataParam): Promise<FetchResponse<200, types.GetNftActivityResponse200>>;
    /**
     * Generate listings for assets (tokens). This API is used to generate listing data to
     * sign. Once you get signing data from this API, you shall sign them and post to another
     * listing creation API to finish listing generation
     *
     * @summary Create Listings (Get Signing Data)
     */
    ixsListGet(body: types.IxsListGetBodyParam): Promise<FetchResponse<200, types.IxsListGetResponse200>>;
    /**
     * Generate listings for assets (tokens). This API is used to create listings with
     * signature provided
     *
     * @summary Create Listings (Creation)
     */
    ixsListPost(body: types.IxsListPostBodyParam): Promise<FetchResponse<200, types.IxsListPostResponse200>>;
    /**
     * Generate bids. This API is used to generate bid data to sign. Once you get signing data
     * from this API, you shall sign them and post to another bid creation API to finish bid
     * generation
     *
     * @summary Create Bids (Get Signing Data)
     */
    ixsBidGet(body: types.IxsBidGetBodyParam): Promise<FetchResponse<200, types.IxsBidGetResponse200>>;
    /**
     * Generate bids. This API is used to create bids with signature provided
     *
     * @summary Create Bids (Creation)
     */
    ixsBidPost(body: types.IxsBidPostBodyParam): Promise<FetchResponse<200, types.IxsBidPostResponse200>>;
    /**
     * Cancel Orders. This API is used to generate order cancellation data to sign. Once you
     * get signing data from this API, you shall sign them and post to another order
     * cancellation API to finish order cancellation
     *
     * @summary Cancel Orders (Get Signing Data)
     */
    ixsCancelOrderGet(body: types.IxsCancelOrderGetBodyParam): Promise<FetchResponse<200, types.IxsCancelOrderGetResponse200>>;
    /**
     * Cancel Orders. This API is used to cancel orders with signature provided
     *
     * @summary Cancel Orders (Cancellation)
     */
    ixsCancelOrderPost(body: types.IxsCancelOrderPostBodyParam): Promise<FetchResponse<200, types.IxsCancelOrderPostResponse200>>;
    /**
     * Bulk transfer assets(tokens). This API is used to generate asset bulk transfer
     * transaction data
     *
     * @summary Bulk Transfer
     */
    ixsBulkTransferGet(body: types.IxsBulkTransferGetBodyParam): Promise<FetchResponse<200, types.IxsBulkTransferGetResponse200>>;
    /**
     * Buy assets(tokens). This API is used to generate transaction data to buy assets
     *
     * @summary Buy Assets
     */
    ixsBuyGet(body: types.IxsBuyGetBodyParam): Promise<FetchResponse<200, types.IxsBuyGetResponse200>>;
    /**
     * Sell assets(tokens). This API is used to generate transaction data to sell assets
     *
     * @summary Sell Assets
     */
    ixsSellGet(body: types.IxsSellGetBodyParam): Promise<FetchResponse<200, types.IxsSellGetResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
