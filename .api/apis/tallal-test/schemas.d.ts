declare const GetAsks: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly "ids[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Direct fetch asks by ids, other filters will be ignored if `ids` is provided. Either `ids` and `collectionId` must be provided";
                };
                readonly collectionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by collectionId. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8`. Either `ids` and `collectionId` must be provided";
                };
                readonly "assetIds[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by asset ids. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0`";
                };
                readonly "makers[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by makers who made these asks. example: `0x47d88afbba889709abba07339ed1c88079944ca3`";
                };
                readonly "sources[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["any", "opensea.io", "magiceden"];
                    };
                    readonly maxItems: 5;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by order source.";
                };
                readonly "status[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                    };
                    readonly maxItems: 5;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by order status. default `active`";
                };
                readonly createAfter: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter orders after some create timestamp using UTC format. example: `2025-05-01T06:01:09.000Z`.";
                };
                readonly updateAfter: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter orders after some update timestamp using UTC format. example: `2025-05-01T06:01:09.000Z`.";
                };
                readonly sortBy: {
                    readonly type: "string";
                    readonly enum: readonly ["price", "createdAt", "updatedAt"];
                    readonly default: "price";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly sortDir: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly default: "asc";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly default: 20;
                    readonly minimum: 1;
                    readonly maximum: 100;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Amount of items returned, default to __20__";
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Use continuation token to request next offset of items.";
                };
            };
            readonly required: readonly ["chain", "ids[]", "collectionId", "createAfter", "updateAfter"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly asks: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly required: readonly ["assetId", "chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                        readonly properties: {
                            readonly assetId: {
                                readonly type: "string";
                            };
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly kind: {
                                readonly type: "string";
                                readonly enum: readonly ["ASK", "BID"];
                                readonly description: "`ASK` `BID`";
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                            };
                            readonly maker: {
                                readonly type: "string";
                            };
                            readonly price: {
                                readonly type: "object";
                                readonly required: readonly ["amount", "currency"];
                                readonly properties: {
                                    readonly amount: {
                                        readonly type: "object";
                                        readonly required: readonly ["raw"];
                                        readonly properties: {
                                            readonly raw: {
                                                readonly type: "string";
                                            };
                                            readonly native: {
                                                readonly type: "string";
                                            };
                                            readonly fiat: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly usd: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                    readonly currency: {
                                        readonly type: "object";
                                        readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                        readonly properties: {
                                            readonly contract: {
                                                readonly type: "string";
                                            };
                                            readonly symbol: {
                                                readonly type: "string";
                                            };
                                            readonly decimals: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                            };
                                            readonly displayName: {
                                                readonly type: "string";
                                            };
                                            readonly fiatConversion: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly usd: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                            readonly quantity: {
                                readonly type: "object";
                                readonly required: readonly ["filled", "remaining"];
                                readonly properties: {
                                    readonly filled: {
                                        readonly type: "string";
                                    };
                                    readonly remaining: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly expiry: {
                                readonly type: "object";
                                readonly required: readonly ["validUntil"];
                                readonly properties: {
                                    readonly validFrom: {
                                        readonly type: "string";
                                    };
                                    readonly validUntil: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly source: {
                                readonly type: "string";
                                readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                            };
                            readonly fees: {
                                readonly type: "object";
                                readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                readonly properties: {
                                    readonly royaltyBp: {
                                        readonly type: "number";
                                        readonly minimum: 0;
                                        readonly maximum: 10000;
                                    };
                                    readonly makerMarketplaceBp: {
                                        readonly type: "number";
                                        readonly minimum: 0;
                                        readonly maximum: 10000;
                                    };
                                    readonly takerMarketplaceBp: {
                                        readonly type: "number";
                                        readonly minimum: 0;
                                        readonly maximum: 10000;
                                    };
                                    readonly lpFeeBp: {
                                        readonly type: "number";
                                        readonly minimum: 0;
                                        readonly maximum: 10000;
                                    };
                                };
                            };
                            readonly createdAt: {
                                readonly type: "string";
                            };
                            readonly updatedAt: {
                                readonly type: "string";
                            };
                            readonly chain: {
                                readonly type: "string";
                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                            };
                            readonly protocol: {
                                readonly type: "string";
                                readonly enum: readonly ["ERC721", "ERC1155"];
                                readonly description: "`ERC721` `ERC1155`";
                            };
                            readonly contract: {
                                readonly type: "string";
                            };
                            readonly contractData: {
                                readonly type: "object";
                                readonly required: readonly ["orderContractKind"];
                                readonly properties: {
                                    readonly orderContractKind: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly description: "used to get next offset of items";
                };
            };
            readonly required: readonly ["asks"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetAssets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly collectionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The collection id to query assets. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8` ";
                };
                readonly "assetIds[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter assets by ids. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0`";
                };
                readonly "includeFloorAskSource[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["any", "opensea.io", "magiceden"];
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter assets whose floor ask is from specific sources. if `any` is specified, means return assets which are listed only";
                };
                readonly name: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter assets by its name";
                };
                readonly includeTopBid: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Whether to include top bid for returned assets, default to __false__";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly default: 20;
                    readonly minimum: 1;
                    readonly maximum: 100;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Amount of items returned, default to __20__";
                };
                readonly sortBy: {
                    readonly type: "string";
                    readonly enum: readonly ["price", "listedAt"];
                    readonly default: "price";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly sortDir: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly default: "asc";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Use continuation token to request next offset of assets.";
                };
            };
            readonly required: readonly ["chain", "collectionId"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly assets: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly asset: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly chain: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly collectionId: {
                                        readonly type: "string";
                                    };
                                    readonly owner: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly assetClass: {
                                        readonly type: "string";
                                        readonly enum: readonly ["NFT", "SFT"];
                                        readonly description: "`NFT` `SFT`";
                                    };
                                    readonly attributes: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly traitType: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["traitType", "value"];
                                        };
                                    };
                                    readonly mediaV2: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly cover: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                        readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                    };
                                                    readonly typeRaw: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["url", "type"];
                                            };
                                            readonly main: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                        readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                    };
                                                    readonly typeRaw: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["url", "type"];
                                            };
                                            readonly additional: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["url", "type"];
                                                };
                                            };
                                        };
                                        readonly required: readonly ["main"];
                                    };
                                    readonly remainingSupply: {
                                        readonly type: "string";
                                    };
                                    readonly rarity: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly provider: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                    readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                };
                                                readonly rank: {
                                                    readonly type: "number";
                                                };
                                            };
                                            readonly required: readonly ["provider", "rank"];
                                        };
                                    };
                                    readonly contractAddress: {
                                        readonly type: "string";
                                    };
                                    readonly tokenId: {
                                        readonly type: "string";
                                    };
                                    readonly standard: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ERC721", "ERC1155"];
                                        readonly description: "`ERC721` `ERC1155`";
                                    };
                                    readonly lastSalePrice: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly amount: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly raw: {
                                                        readonly type: "string";
                                                    };
                                                    readonly native: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiat: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["raw"];
                                            };
                                            readonly currency: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly contract: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                    };
                                                    readonly displayName: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiatConversion: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "number";
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            };
                                        };
                                        readonly required: readonly ["amount", "currency"];
                                    };
                                };
                                readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                            };
                            readonly floorAsk: {
                                readonly type: "object";
                                readonly required: readonly ["assetId", "chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                readonly properties: {
                                    readonly assetId: {
                                        readonly type: "string";
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly kind: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ASK", "BID"];
                                        readonly description: "`ASK` `BID`";
                                    };
                                    readonly status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                        readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                    };
                                    readonly maker: {
                                        readonly type: "string";
                                    };
                                    readonly price: {
                                        readonly type: "object";
                                        readonly required: readonly ["amount", "currency"];
                                        readonly properties: {
                                            readonly amount: {
                                                readonly type: "object";
                                                readonly required: readonly ["raw"];
                                                readonly properties: {
                                                    readonly raw: {
                                                        readonly type: "string";
                                                    };
                                                    readonly native: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiat: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly currency: {
                                                readonly type: "object";
                                                readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                readonly properties: {
                                                    readonly contract: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                    };
                                                    readonly displayName: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiatConversion: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "number";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                    readonly quantity: {
                                        readonly type: "object";
                                        readonly required: readonly ["filled", "remaining"];
                                        readonly properties: {
                                            readonly filled: {
                                                readonly type: "string";
                                            };
                                            readonly remaining: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly expiry: {
                                        readonly type: "object";
                                        readonly required: readonly ["validUntil"];
                                        readonly properties: {
                                            readonly validFrom: {
                                                readonly type: "string";
                                            };
                                            readonly validUntil: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly source: {
                                        readonly type: "string";
                                        readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                        readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                    };
                                    readonly fees: {
                                        readonly type: "object";
                                        readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                        readonly properties: {
                                            readonly royaltyBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly makerMarketplaceBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly takerMarketplaceBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly lpFeeBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                        };
                                    };
                                    readonly createdAt: {
                                        readonly type: "string";
                                    };
                                    readonly updatedAt: {
                                        readonly type: "string";
                                    };
                                    readonly chain: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                    };
                                    readonly protocol: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ERC721", "ERC1155"];
                                        readonly description: "`ERC721` `ERC1155`";
                                    };
                                    readonly contract: {
                                        readonly type: "string";
                                    };
                                    readonly contractData: {
                                        readonly type: "object";
                                        readonly required: readonly ["orderContractKind"];
                                        readonly properties: {
                                            readonly orderContractKind: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly topBid: {
                                readonly oneOf: readonly [{
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["assetId"];
                                            readonly properties: {
                                                readonly assetId: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }, {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["collectionId"];
                                            readonly properties: {
                                                readonly collectionId: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }, {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["collectionId", "attributes"];
                                            readonly properties: {
                                                readonly collectionId: {
                                                    readonly type: "string";
                                                };
                                                readonly attributes: {
                                                    readonly type: "array";
                                                    readonly minItems: 1;
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["name", "value"];
                                                        readonly properties: {
                                                            readonly name: {
                                                                readonly type: "string";
                                                            };
                                                            readonly value: {
                                                                readonly oneOf: readonly [{
                                                                    readonly type: "string";
                                                                }, {
                                                                    readonly type: "number";
                                                                }];
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }];
                                readonly type: "object";
                                readonly required: readonly ["type"];
                            };
                        };
                        readonly required: readonly ["asset"];
                    };
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly description: "used to get next offset of items";
                };
            };
            readonly required: readonly ["assets"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetBids: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly "ids[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Direct fetch bids by ids, other filters will be ignored if `ids` is provided. Either `ids` and `bidTypes[] + collectionId` must be provided";
                };
                readonly "bidTypes[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                    };
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by bid types";
                };
                readonly collectionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by collectionId. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8`. Either `ids` and `collectionId` must be provided";
                };
                readonly "assetIds[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by asset ids. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0`";
                };
                readonly "attributes[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by attributes, could be a list, format as `<attribute_name>:<attribute_value>`, example: `Background:Black`";
                };
                readonly "makers[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by makers who made these bids. example: `0x47d88afbba889709abba07339ed1c88079944ca3`";
                };
                readonly "sources[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["any", "opensea.io", "magiceden"];
                    };
                    readonly maxItems: 5;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by order source.";
                };
                readonly "status[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                    };
                    readonly maxItems: 5;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter by order status. default `active`";
                };
                readonly createAfter: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter orders after some create timestamp using UTC format. example: `2025-05-01T06:01:09.000Z`.";
                };
                readonly updateAfter: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter orders after some update timestamp using UTC format. example: `2025-05-01T06:01:09.000Z`.";
                };
                readonly sortBy: {
                    readonly type: "string";
                    readonly enum: readonly ["price", "createdAt", "updatedAt"];
                    readonly default: "price";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly sortDir: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly default: "desc";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly default: 20;
                    readonly minimum: 1;
                    readonly maximum: 100;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Amount of items returned, default to __20__";
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Use continuation token to request next offset of items.";
                };
            };
            readonly required: readonly ["chain", "ids[]", "bidTypes[]", "collectionId", "createAfter", "updateAfter"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly bids: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly type: "object";
                            readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK", "BID"];
                                    readonly description: "`ASK` `BID`";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["assetId"];
                                    readonly properties: {
                                        readonly assetId: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly status: {
                                    readonly type: "string";
                                    readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                    readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly price: {
                                    readonly type: "object";
                                    readonly required: readonly ["amount", "currency"];
                                    readonly properties: {
                                        readonly amount: {
                                            readonly type: "object";
                                            readonly required: readonly ["raw"];
                                            readonly properties: {
                                                readonly raw: {
                                                    readonly type: "string";
                                                };
                                                readonly native: {
                                                    readonly type: "string";
                                                };
                                                readonly fiat: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly currency: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly symbol: {
                                                    readonly type: "string";
                                                };
                                                readonly decimals: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                };
                                                readonly displayName: {
                                                    readonly type: "string";
                                                };
                                                readonly fiatConversion: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "object";
                                    readonly required: readonly ["filled", "remaining"];
                                    readonly properties: {
                                        readonly filled: {
                                            readonly type: "string";
                                        };
                                        readonly remaining: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly expiry: {
                                    readonly type: "object";
                                    readonly required: readonly ["validUntil"];
                                    readonly properties: {
                                        readonly validFrom: {
                                            readonly type: "string";
                                        };
                                        readonly validUntil: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly source: {
                                    readonly type: "string";
                                    readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                    readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                };
                                readonly fees: {
                                    readonly type: "object";
                                    readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                    readonly properties: {
                                        readonly royaltyBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly makerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly takerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly lpFeeBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                    };
                                };
                                readonly createdAt: {
                                    readonly type: "string";
                                };
                                readonly updatedAt: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                    readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                };
                                readonly protocol: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ERC721", "ERC1155"];
                                    readonly description: "`ERC721` `ERC1155`";
                                };
                                readonly contract: {
                                    readonly type: "string";
                                };
                                readonly contractData: {
                                    readonly type: "object";
                                    readonly required: readonly ["orderContractKind"];
                                    readonly properties: {
                                        readonly orderContractKind: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                    readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK", "BID"];
                                    readonly description: "`ASK` `BID`";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collectionId"];
                                    readonly properties: {
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly status: {
                                    readonly type: "string";
                                    readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                    readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly price: {
                                    readonly type: "object";
                                    readonly required: readonly ["amount", "currency"];
                                    readonly properties: {
                                        readonly amount: {
                                            readonly type: "object";
                                            readonly required: readonly ["raw"];
                                            readonly properties: {
                                                readonly raw: {
                                                    readonly type: "string";
                                                };
                                                readonly native: {
                                                    readonly type: "string";
                                                };
                                                readonly fiat: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly currency: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly symbol: {
                                                    readonly type: "string";
                                                };
                                                readonly decimals: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                };
                                                readonly displayName: {
                                                    readonly type: "string";
                                                };
                                                readonly fiatConversion: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "object";
                                    readonly required: readonly ["filled", "remaining"];
                                    readonly properties: {
                                        readonly filled: {
                                            readonly type: "string";
                                        };
                                        readonly remaining: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly expiry: {
                                    readonly type: "object";
                                    readonly required: readonly ["validUntil"];
                                    readonly properties: {
                                        readonly validFrom: {
                                            readonly type: "string";
                                        };
                                        readonly validUntil: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly source: {
                                    readonly type: "string";
                                    readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                    readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                };
                                readonly fees: {
                                    readonly type: "object";
                                    readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                    readonly properties: {
                                        readonly royaltyBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly makerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly takerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly lpFeeBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                    };
                                };
                                readonly createdAt: {
                                    readonly type: "string";
                                };
                                readonly updatedAt: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                    readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                };
                                readonly protocol: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ERC721", "ERC1155"];
                                    readonly description: "`ERC721` `ERC1155`";
                                };
                                readonly contract: {
                                    readonly type: "string";
                                };
                                readonly contractData: {
                                    readonly type: "object";
                                    readonly required: readonly ["orderContractKind"];
                                    readonly properties: {
                                        readonly orderContractKind: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                    readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                            readonly properties: {
                                readonly kind: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK", "BID"];
                                    readonly description: "`ASK` `BID`";
                                };
                                readonly criteria: {
                                    readonly type: "object";
                                    readonly required: readonly ["collectionId", "attributes"];
                                    readonly properties: {
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly minItems: 1;
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["name", "value"];
                                                readonly properties: {
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly oneOf: readonly [{
                                                            readonly type: "string";
                                                        }, {
                                                            readonly type: "number";
                                                        }];
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly id: {
                                    readonly type: "string";
                                };
                                readonly status: {
                                    readonly type: "string";
                                    readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                    readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                };
                                readonly maker: {
                                    readonly type: "string";
                                };
                                readonly price: {
                                    readonly type: "object";
                                    readonly required: readonly ["amount", "currency"];
                                    readonly properties: {
                                        readonly amount: {
                                            readonly type: "object";
                                            readonly required: readonly ["raw"];
                                            readonly properties: {
                                                readonly raw: {
                                                    readonly type: "string";
                                                };
                                                readonly native: {
                                                    readonly type: "string";
                                                };
                                                readonly fiat: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly currency: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly symbol: {
                                                    readonly type: "string";
                                                };
                                                readonly decimals: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                };
                                                readonly displayName: {
                                                    readonly type: "string";
                                                };
                                                readonly fiatConversion: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly quantity: {
                                    readonly type: "object";
                                    readonly required: readonly ["filled", "remaining"];
                                    readonly properties: {
                                        readonly filled: {
                                            readonly type: "string";
                                        };
                                        readonly remaining: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly expiry: {
                                    readonly type: "object";
                                    readonly required: readonly ["validUntil"];
                                    readonly properties: {
                                        readonly validFrom: {
                                            readonly type: "string";
                                        };
                                        readonly validUntil: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly source: {
                                    readonly type: "string";
                                    readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                    readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                };
                                readonly fees: {
                                    readonly type: "object";
                                    readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                    readonly properties: {
                                        readonly royaltyBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly makerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly takerMarketplaceBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                        readonly lpFeeBp: {
                                            readonly type: "number";
                                            readonly minimum: 0;
                                            readonly maximum: 10000;
                                        };
                                    };
                                };
                                readonly createdAt: {
                                    readonly type: "string";
                                };
                                readonly updatedAt: {
                                    readonly type: "string";
                                };
                                readonly chain: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                    readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                };
                                readonly protocol: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ERC721", "ERC1155"];
                                    readonly description: "`ERC721` `ERC1155`";
                                };
                                readonly contract: {
                                    readonly type: "string";
                                };
                                readonly contractData: {
                                    readonly type: "object";
                                    readonly required: readonly ["orderContractKind"];
                                    readonly properties: {
                                        readonly orderContractKind: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                    readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                };
                            };
                        }];
                        readonly type: "object";
                        readonly required: readonly ["type"];
                    };
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly description: "used to get next offset of items";
                };
            };
            readonly required: readonly ["bids"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetCollections: {
    readonly body: {
        readonly type: "object";
        readonly oneOf: readonly [{
            readonly type: "object";
            readonly required: readonly ["collectionIds"];
            readonly properties: {
                readonly collectionIds: {
                    readonly description: "List of collection IDs to retrieve. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8` ";
                    readonly type: "array";
                    readonly maxItems: 100;
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                };
                readonly includeMintConfig: {
                    readonly type: "boolean";
                    readonly description: "Whether to include mint configuration.";
                };
                readonly includeOwnerAddress: {
                    readonly type: "boolean";
                    readonly description: "Whether to include owner address.";
                };
            };
        }, {
            readonly type: "object";
            readonly required: readonly ["collectionSlugs"];
            readonly properties: {
                readonly collectionSlugs: {
                    readonly description: "List of collection Slugs to retrieve. example: `pudgypenguins` ";
                    readonly type: "array";
                    readonly maxItems: 100;
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                };
                readonly includeMintConfig: {
                    readonly type: "boolean";
                    readonly description: "Whether to include mint configuration.";
                };
                readonly includeOwnerAddress: {
                    readonly type: "boolean";
                    readonly description: "Whether to include owner address.";
                };
            };
        }];
        readonly required: readonly ["chain"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly collections: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly chain: {
                                readonly type: "string";
                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                            };
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly symbol: {
                                readonly type: "string";
                                readonly description: "i.e. collection slug";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly media: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly mimeType: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly social: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly twitterUsername: {
                                        readonly type: "string";
                                    };
                                    readonly discordUrl: {
                                        readonly type: "string";
                                    };
                                    readonly websiteUrl: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly verification: {
                                readonly type: "string";
                                readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                readonly description: "`VERIFIED` `UNVERIFIED`";
                            };
                            readonly isTradeable: {
                                readonly type: "boolean";
                            };
                            readonly royalty: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly recipient: {
                                        readonly type: "string";
                                    };
                                    readonly bps: {
                                        readonly type: "number";
                                        readonly maximum: 10000;
                                        readonly minimum: 0;
                                    };
                                    readonly isOptional: {
                                        readonly type: "boolean";
                                    };
                                };
                                readonly required: readonly ["recipient", "bps", "isOptional"];
                            };
                            readonly collectionType: {
                                readonly type: "string";
                                readonly enum: readonly ["ERC721", "ERC1155"];
                                readonly description: "`ERC721` `ERC1155`";
                            };
                            readonly isSeaportV16Disabled: {
                                readonly type: "boolean";
                            };
                            readonly isSeaportV16RoyaltyOptional: {
                                readonly type: "boolean";
                            };
                            readonly seaportV16ListingCurrencies: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "number";
                                        };
                                    };
                                    readonly required: readonly ["address", "name", "symbol", "decimals"];
                                };
                            };
                            readonly chainData: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly contract: {
                                        readonly type: "string";
                                    };
                                    readonly transferability: {
                                        readonly type: "string";
                                        readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                        readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                    };
                                    readonly collectionBidSupported: {
                                        readonly type: "boolean";
                                    };
                                    readonly contractDeployedAt: {
                                        readonly type: "string";
                                    };
                                    readonly isMinting: {
                                        readonly type: "boolean";
                                    };
                                    readonly owner: {
                                        readonly type: "string";
                                    };
                                    readonly mintConfig: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly maxSupply: {
                                                readonly type: "string";
                                            };
                                            readonly totalSupply: {
                                                readonly type: "string";
                                            };
                                            readonly walletLimit: {
                                                readonly type: "string";
                                            };
                                            readonly baseURI: {
                                                readonly type: "string";
                                            };
                                            readonly contractURI: {
                                                readonly type: "string";
                                            };
                                            readonly stages: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly kind: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["public", "allowlist"];
                                                            readonly description: "`public` `allowlist`";
                                                        };
                                                        readonly price: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly currency: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly chain: {
                                                                            readonly type: "string";
                                                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                        };
                                                                        readonly assetId: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                    readonly required: readonly ["chain", "assetId"];
                                                                };
                                                                readonly raw: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["currency", "raw"];
                                                        };
                                                        readonly startTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                            readonly maximum: 1000;
                                                        };
                                                        readonly maxSupply: {
                                                            readonly type: "number";
                                                            readonly minimum: 1;
                                                        };
                                                    };
                                                    readonly required: readonly ["kind", "price"];
                                                };
                                            };
                                            readonly payoutRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyBps: {
                                                readonly type: "string";
                                            };
                                            readonly mintFee: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                    };
                                };
                                readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                            };
                        };
                        readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                    };
                };
            };
            readonly required: readonly ["collections"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetNftActivity: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly "activityTypes[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                    };
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The activity types to query";
                };
                readonly fromTime: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "`From time` of time range to query";
                };
                readonly toTime: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "`To time` of time range to query";
                };
                readonly assetId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Asset Id to filter for activities. Either `assetId` or `collectionId` or `walletAddress` should be provided. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0`";
                };
                readonly collectionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Collection Id to filter for activities. Either `assetId` or `collectionId` or `walletAddress` should be provided. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8`";
                };
                readonly walletAddress: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "User wallet address to filter for activities. Either `assetId` or `collectionId` or `walletAddress` should be provided. example: `0x47d88afbba889709abba07339ed1c88079944ca3`";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly default: 20;
                    readonly minimum: 1;
                    readonly maximum: 100;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Amount of items returned, default to __20__";
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Use continuation token to request next offset of items.";
                };
            };
            readonly required: readonly ["chain", "activityTypes[]", "assetId", "collectionId", "walletAddress"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly activities: {
                    readonly type: "array";
                    readonly items: {
                        readonly oneOf: readonly [{
                            readonly type: "object";
                            readonly required: readonly ["activityId", "activityType", "assetAmount", "fromAddress", "order", "timestamp", "toAddress", "transactionInfo", "unitPrice"];
                            readonly properties: {
                                readonly assetAmount: {
                                    readonly type: "string";
                                };
                                readonly fromAddress: {
                                    readonly type: "string";
                                };
                                readonly toAddress: {
                                    readonly type: "string";
                                };
                                readonly order: {
                                    readonly type: "object";
                                    readonly required: readonly ["orderId", "sourceDomain"];
                                    readonly properties: {
                                        readonly orderId: {
                                            readonly type: "string";
                                        };
                                        readonly orderKind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly bidType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                        readonly sourceDomain: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly unitPrice: {
                                    readonly type: "object";
                                    readonly required: readonly ["amount", "currency"];
                                    readonly properties: {
                                        readonly amount: {
                                            readonly type: "object";
                                            readonly required: readonly ["raw"];
                                            readonly properties: {
                                                readonly raw: {
                                                    readonly type: "string";
                                                };
                                                readonly native: {
                                                    readonly type: "string";
                                                };
                                                readonly fiat: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly currency: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly symbol: {
                                                    readonly type: "string";
                                                };
                                                readonly decimals: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                };
                                                readonly displayName: {
                                                    readonly type: "string";
                                                };
                                                readonly fiatConversion: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly fees: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly required: readonly ["kind", "recipient", "currencyId", "bps", "rawAmount"];
                                        readonly properties: {
                                            readonly kind: {
                                                readonly type: "string";
                                                readonly enum: readonly ["unknown", "maker_marketplace", "taker_marketplace", "royalty", "liquidity_provider", "marketplace"];
                                                readonly description: "`unknown` `maker_marketplace` `taker_marketplace` `royalty` `liquidity_provider` `marketplace`";
                                            };
                                            readonly recipient: {
                                                readonly type: "string";
                                            };
                                            readonly bps: {
                                                readonly type: "number";
                                            };
                                            readonly rawAmount: {
                                                readonly type: "string";
                                            };
                                            readonly currencyId: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                                readonly transactionInfo: {
                                    readonly type: "object";
                                    readonly required: readonly ["transactionId", "blockNumber", "blockHash"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly transactionId: {
                                            readonly type: "string";
                                        };
                                        readonly transactionIndex: {
                                            readonly type: "number";
                                        };
                                        readonly blockNumber: {
                                            readonly type: "number";
                                        };
                                        readonly blockHash: {
                                            readonly type: "string";
                                        };
                                        readonly logIndex: {
                                            readonly type: "number";
                                        };
                                        readonly batchTransferIndex: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                                readonly activityType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                                    readonly description: "`ASK_CREATED` `ASK_CANCELLED` `BID_CREATED` `BID_CANCELLED` `BURN` `MINT` `TRANSFER` `TRADE`";
                                };
                                readonly activityId: {
                                    readonly type: "string";
                                };
                                readonly timestamp: {
                                    readonly type: "string";
                                };
                                readonly collection: {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                            readonly description: "i.e. collection slug";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly media: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly url: {
                                                    readonly type: "string";
                                                };
                                                readonly mimeType: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly social: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly twitterUsername: {
                                                    readonly type: "string";
                                                };
                                                readonly discordUrl: {
                                                    readonly type: "string";
                                                };
                                                readonly websiteUrl: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly verification: {
                                            readonly type: "string";
                                            readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                            readonly description: "`VERIFIED` `UNVERIFIED`";
                                        };
                                        readonly isTradeable: {
                                            readonly type: "boolean";
                                        };
                                        readonly royalty: {
                                            readonly type: "object";
                                            readonly required: readonly ["recipient", "bps", "isOptional"];
                                            readonly properties: {
                                                readonly recipient: {
                                                    readonly type: "string";
                                                };
                                                readonly bps: {
                                                    readonly type: "number";
                                                    readonly maximum: 10000;
                                                    readonly minimum: 0;
                                                };
                                                readonly isOptional: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                        readonly collectionType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly isSeaportV16Disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly isSeaportV16RoyaltyOptional: {
                                            readonly type: "boolean";
                                        };
                                        readonly seaportV16ListingCurrencies: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["address", "name", "symbol", "decimals"];
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly chainData: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly transferability: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                                    readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                                };
                                                readonly collectionBidSupported: {
                                                    readonly type: "boolean";
                                                };
                                                readonly contractDeployedAt: {
                                                    readonly type: "string";
                                                };
                                                readonly isMinting: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "string";
                                                };
                                                readonly mintConfig: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                                    readonly properties: {
                                                        readonly maxSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly totalSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "string";
                                                        };
                                                        readonly baseURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contractURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly stages: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly required: readonly ["kind", "price"];
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["public", "allowlist"];
                                                                        readonly description: "`public` `allowlist`";
                                                                    };
                                                                    readonly price: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["currency", "raw"];
                                                                        readonly properties: {
                                                                            readonly currency: {
                                                                                readonly type: "object";
                                                                                readonly required: readonly ["chain", "assetId"];
                                                                                readonly properties: {
                                                                                    readonly chain: {
                                                                                        readonly type: "string";
                                                                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                                    };
                                                                                    readonly assetId: {
                                                                                        readonly type: "string";
                                                                                    };
                                                                                };
                                                                            };
                                                                            readonly raw: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly startTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly endTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly walletLimit: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 0;
                                                                        readonly maximum: 1000;
                                                                    };
                                                                    readonly maxSupply: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 1;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly payoutRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyBps: {
                                                            readonly type: "string";
                                                        };
                                                        readonly mintFee: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly owner: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly assetClass: {
                                            readonly type: "string";
                                            readonly enum: readonly ["NFT", "SFT"];
                                            readonly description: "`NFT` `SFT`";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["traitType", "value"];
                                                readonly properties: {
                                                    readonly traitType: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                        readonly mediaV2: {
                                            readonly type: "object";
                                            readonly required: readonly ["main"];
                                            readonly properties: {
                                                readonly cover: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly main: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly additional: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["url", "type"];
                                                        readonly properties: {
                                                            readonly url: {
                                                                readonly type: "string";
                                                            };
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                                readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                            };
                                                            readonly typeRaw: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly remainingSupply: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["provider", "rank"];
                                                readonly properties: {
                                                    readonly provider: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                        readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                    };
                                                    readonly rank: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly contractAddress: {
                                            readonly type: "string";
                                        };
                                        readonly tokenId: {
                                            readonly type: "string";
                                        };
                                        readonly standard: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly lastSalePrice: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["activityId", "activityType", "assetAmount", "fromAddress", "timestamp", "toAddress", "transactionInfo"];
                            readonly properties: {
                                readonly assetAmount: {
                                    readonly type: "string";
                                };
                                readonly fromAddress: {
                                    readonly type: "string";
                                };
                                readonly toAddress: {
                                    readonly type: "string";
                                };
                                readonly transactionInfo: {
                                    readonly type: "object";
                                    readonly required: readonly ["transactionId", "blockNumber", "blockHash"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly transactionId: {
                                            readonly type: "string";
                                        };
                                        readonly transactionIndex: {
                                            readonly type: "number";
                                        };
                                        readonly blockNumber: {
                                            readonly type: "number";
                                        };
                                        readonly blockHash: {
                                            readonly type: "string";
                                        };
                                        readonly logIndex: {
                                            readonly type: "number";
                                        };
                                        readonly batchTransferIndex: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                                readonly activityType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                                    readonly description: "`ASK_CREATED` `ASK_CANCELLED` `BID_CREATED` `BID_CANCELLED` `BURN` `MINT` `TRANSFER` `TRADE`";
                                };
                                readonly activityId: {
                                    readonly type: "string";
                                };
                                readonly timestamp: {
                                    readonly type: "string";
                                };
                                readonly collection: {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                            readonly description: "i.e. collection slug";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly media: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly url: {
                                                    readonly type: "string";
                                                };
                                                readonly mimeType: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly social: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly twitterUsername: {
                                                    readonly type: "string";
                                                };
                                                readonly discordUrl: {
                                                    readonly type: "string";
                                                };
                                                readonly websiteUrl: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly verification: {
                                            readonly type: "string";
                                            readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                            readonly description: "`VERIFIED` `UNVERIFIED`";
                                        };
                                        readonly isTradeable: {
                                            readonly type: "boolean";
                                        };
                                        readonly royalty: {
                                            readonly type: "object";
                                            readonly required: readonly ["recipient", "bps", "isOptional"];
                                            readonly properties: {
                                                readonly recipient: {
                                                    readonly type: "string";
                                                };
                                                readonly bps: {
                                                    readonly type: "number";
                                                    readonly maximum: 10000;
                                                    readonly minimum: 0;
                                                };
                                                readonly isOptional: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                        readonly collectionType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly isSeaportV16Disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly isSeaportV16RoyaltyOptional: {
                                            readonly type: "boolean";
                                        };
                                        readonly seaportV16ListingCurrencies: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["address", "name", "symbol", "decimals"];
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly chainData: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly transferability: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                                    readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                                };
                                                readonly collectionBidSupported: {
                                                    readonly type: "boolean";
                                                };
                                                readonly contractDeployedAt: {
                                                    readonly type: "string";
                                                };
                                                readonly isMinting: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "string";
                                                };
                                                readonly mintConfig: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                                    readonly properties: {
                                                        readonly maxSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly totalSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "string";
                                                        };
                                                        readonly baseURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contractURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly stages: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly required: readonly ["kind", "price"];
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["public", "allowlist"];
                                                                        readonly description: "`public` `allowlist`";
                                                                    };
                                                                    readonly price: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["currency", "raw"];
                                                                        readonly properties: {
                                                                            readonly currency: {
                                                                                readonly type: "object";
                                                                                readonly required: readonly ["chain", "assetId"];
                                                                                readonly properties: {
                                                                                    readonly chain: {
                                                                                        readonly type: "string";
                                                                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                                    };
                                                                                    readonly assetId: {
                                                                                        readonly type: "string";
                                                                                    };
                                                                                };
                                                                            };
                                                                            readonly raw: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly startTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly endTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly walletLimit: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 0;
                                                                        readonly maximum: 1000;
                                                                    };
                                                                    readonly maxSupply: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 1;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly payoutRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyBps: {
                                                            readonly type: "string";
                                                        };
                                                        readonly mintFee: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly owner: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly assetClass: {
                                            readonly type: "string";
                                            readonly enum: readonly ["NFT", "SFT"];
                                            readonly description: "`NFT` `SFT`";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["traitType", "value"];
                                                readonly properties: {
                                                    readonly traitType: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                        readonly mediaV2: {
                                            readonly type: "object";
                                            readonly required: readonly ["main"];
                                            readonly properties: {
                                                readonly cover: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly main: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly additional: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["url", "type"];
                                                        readonly properties: {
                                                            readonly url: {
                                                                readonly type: "string";
                                                            };
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                                readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                            };
                                                            readonly typeRaw: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly remainingSupply: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["provider", "rank"];
                                                readonly properties: {
                                                    readonly provider: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                        readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                    };
                                                    readonly rank: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly contractAddress: {
                                            readonly type: "string";
                                        };
                                        readonly tokenId: {
                                            readonly type: "string";
                                        };
                                        readonly standard: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly lastSalePrice: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["activityId", "activityType", "assetAmount", "timestamp", "toAddress", "transactionInfo"];
                            readonly properties: {
                                readonly assetAmount: {
                                    readonly type: "string";
                                };
                                readonly toAddress: {
                                    readonly type: "string";
                                };
                                readonly unitPrice: {
                                    readonly type: "object";
                                    readonly required: readonly ["amount", "currency"];
                                    readonly properties: {
                                        readonly amount: {
                                            readonly type: "object";
                                            readonly required: readonly ["raw"];
                                            readonly properties: {
                                                readonly raw: {
                                                    readonly type: "string";
                                                };
                                                readonly native: {
                                                    readonly type: "string";
                                                };
                                                readonly fiat: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly currency: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly symbol: {
                                                    readonly type: "string";
                                                };
                                                readonly decimals: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                };
                                                readonly displayName: {
                                                    readonly type: "string";
                                                };
                                                readonly fiatConversion: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly usd: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly fees: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly required: readonly ["kind", "recipient", "currencyId", "bps", "rawAmount"];
                                        readonly properties: {
                                            readonly kind: {
                                                readonly type: "string";
                                                readonly enum: readonly ["unknown", "maker_marketplace", "taker_marketplace", "royalty", "liquidity_provider", "marketplace"];
                                                readonly description: "`unknown` `maker_marketplace` `taker_marketplace` `royalty` `liquidity_provider` `marketplace`";
                                            };
                                            readonly recipient: {
                                                readonly type: "string";
                                            };
                                            readonly bps: {
                                                readonly type: "number";
                                            };
                                            readonly rawAmount: {
                                                readonly type: "string";
                                            };
                                            readonly currencyId: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                                readonly transactionInfo: {
                                    readonly type: "object";
                                    readonly required: readonly ["transactionId", "blockNumber", "blockHash"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly transactionId: {
                                            readonly type: "string";
                                        };
                                        readonly transactionIndex: {
                                            readonly type: "number";
                                        };
                                        readonly blockNumber: {
                                            readonly type: "number";
                                        };
                                        readonly blockHash: {
                                            readonly type: "string";
                                        };
                                        readonly logIndex: {
                                            readonly type: "number";
                                        };
                                        readonly batchTransferIndex: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                                readonly activityType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                                    readonly description: "`ASK_CREATED` `ASK_CANCELLED` `BID_CREATED` `BID_CANCELLED` `BURN` `MINT` `TRANSFER` `TRADE`";
                                };
                                readonly activityId: {
                                    readonly type: "string";
                                };
                                readonly timestamp: {
                                    readonly type: "string";
                                };
                                readonly collection: {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                            readonly description: "i.e. collection slug";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly media: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly url: {
                                                    readonly type: "string";
                                                };
                                                readonly mimeType: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly social: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly twitterUsername: {
                                                    readonly type: "string";
                                                };
                                                readonly discordUrl: {
                                                    readonly type: "string";
                                                };
                                                readonly websiteUrl: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly verification: {
                                            readonly type: "string";
                                            readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                            readonly description: "`VERIFIED` `UNVERIFIED`";
                                        };
                                        readonly isTradeable: {
                                            readonly type: "boolean";
                                        };
                                        readonly royalty: {
                                            readonly type: "object";
                                            readonly required: readonly ["recipient", "bps", "isOptional"];
                                            readonly properties: {
                                                readonly recipient: {
                                                    readonly type: "string";
                                                };
                                                readonly bps: {
                                                    readonly type: "number";
                                                    readonly maximum: 10000;
                                                    readonly minimum: 0;
                                                };
                                                readonly isOptional: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                        readonly collectionType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly isSeaportV16Disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly isSeaportV16RoyaltyOptional: {
                                            readonly type: "boolean";
                                        };
                                        readonly seaportV16ListingCurrencies: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["address", "name", "symbol", "decimals"];
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly chainData: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly transferability: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                                    readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                                };
                                                readonly collectionBidSupported: {
                                                    readonly type: "boolean";
                                                };
                                                readonly contractDeployedAt: {
                                                    readonly type: "string";
                                                };
                                                readonly isMinting: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "string";
                                                };
                                                readonly mintConfig: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                                    readonly properties: {
                                                        readonly maxSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly totalSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "string";
                                                        };
                                                        readonly baseURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contractURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly stages: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly required: readonly ["kind", "price"];
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["public", "allowlist"];
                                                                        readonly description: "`public` `allowlist`";
                                                                    };
                                                                    readonly price: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["currency", "raw"];
                                                                        readonly properties: {
                                                                            readonly currency: {
                                                                                readonly type: "object";
                                                                                readonly required: readonly ["chain", "assetId"];
                                                                                readonly properties: {
                                                                                    readonly chain: {
                                                                                        readonly type: "string";
                                                                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                                    };
                                                                                    readonly assetId: {
                                                                                        readonly type: "string";
                                                                                    };
                                                                                };
                                                                            };
                                                                            readonly raw: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly startTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly endTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly walletLimit: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 0;
                                                                        readonly maximum: 1000;
                                                                    };
                                                                    readonly maxSupply: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 1;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly payoutRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyBps: {
                                                            readonly type: "string";
                                                        };
                                                        readonly mintFee: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly owner: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly assetClass: {
                                            readonly type: "string";
                                            readonly enum: readonly ["NFT", "SFT"];
                                            readonly description: "`NFT` `SFT`";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["traitType", "value"];
                                                readonly properties: {
                                                    readonly traitType: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                        readonly mediaV2: {
                                            readonly type: "object";
                                            readonly required: readonly ["main"];
                                            readonly properties: {
                                                readonly cover: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly main: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly additional: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["url", "type"];
                                                        readonly properties: {
                                                            readonly url: {
                                                                readonly type: "string";
                                                            };
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                                readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                            };
                                                            readonly typeRaw: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly remainingSupply: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["provider", "rank"];
                                                readonly properties: {
                                                    readonly provider: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                        readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                    };
                                                    readonly rank: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly contractAddress: {
                                            readonly type: "string";
                                        };
                                        readonly tokenId: {
                                            readonly type: "string";
                                        };
                                        readonly standard: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly lastSalePrice: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["activityId", "activityType", "ask", "timestamp"];
                            readonly properties: {
                                readonly ask: {
                                    readonly type: "object";
                                    readonly required: readonly ["assetId", "chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly assetId: {
                                            readonly type: "string";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly activityType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                                    readonly description: "`ASK_CREATED` `ASK_CANCELLED` `BID_CREATED` `BID_CANCELLED` `BURN` `MINT` `TRANSFER` `TRADE`";
                                };
                                readonly activityId: {
                                    readonly type: "string";
                                };
                                readonly timestamp: {
                                    readonly type: "string";
                                };
                                readonly collection: {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                            readonly description: "i.e. collection slug";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly media: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly url: {
                                                    readonly type: "string";
                                                };
                                                readonly mimeType: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly social: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly twitterUsername: {
                                                    readonly type: "string";
                                                };
                                                readonly discordUrl: {
                                                    readonly type: "string";
                                                };
                                                readonly websiteUrl: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly verification: {
                                            readonly type: "string";
                                            readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                            readonly description: "`VERIFIED` `UNVERIFIED`";
                                        };
                                        readonly isTradeable: {
                                            readonly type: "boolean";
                                        };
                                        readonly royalty: {
                                            readonly type: "object";
                                            readonly required: readonly ["recipient", "bps", "isOptional"];
                                            readonly properties: {
                                                readonly recipient: {
                                                    readonly type: "string";
                                                };
                                                readonly bps: {
                                                    readonly type: "number";
                                                    readonly maximum: 10000;
                                                    readonly minimum: 0;
                                                };
                                                readonly isOptional: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                        readonly collectionType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly isSeaportV16Disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly isSeaportV16RoyaltyOptional: {
                                            readonly type: "boolean";
                                        };
                                        readonly seaportV16ListingCurrencies: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["address", "name", "symbol", "decimals"];
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly chainData: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly transferability: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                                    readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                                };
                                                readonly collectionBidSupported: {
                                                    readonly type: "boolean";
                                                };
                                                readonly contractDeployedAt: {
                                                    readonly type: "string";
                                                };
                                                readonly isMinting: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "string";
                                                };
                                                readonly mintConfig: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                                    readonly properties: {
                                                        readonly maxSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly totalSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "string";
                                                        };
                                                        readonly baseURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contractURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly stages: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly required: readonly ["kind", "price"];
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["public", "allowlist"];
                                                                        readonly description: "`public` `allowlist`";
                                                                    };
                                                                    readonly price: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["currency", "raw"];
                                                                        readonly properties: {
                                                                            readonly currency: {
                                                                                readonly type: "object";
                                                                                readonly required: readonly ["chain", "assetId"];
                                                                                readonly properties: {
                                                                                    readonly chain: {
                                                                                        readonly type: "string";
                                                                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                                    };
                                                                                    readonly assetId: {
                                                                                        readonly type: "string";
                                                                                    };
                                                                                };
                                                                            };
                                                                            readonly raw: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly startTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly endTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly walletLimit: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 0;
                                                                        readonly maximum: 1000;
                                                                    };
                                                                    readonly maxSupply: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 1;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly payoutRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyBps: {
                                                            readonly type: "string";
                                                        };
                                                        readonly mintFee: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly owner: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly assetClass: {
                                            readonly type: "string";
                                            readonly enum: readonly ["NFT", "SFT"];
                                            readonly description: "`NFT` `SFT`";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["traitType", "value"];
                                                readonly properties: {
                                                    readonly traitType: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                        readonly mediaV2: {
                                            readonly type: "object";
                                            readonly required: readonly ["main"];
                                            readonly properties: {
                                                readonly cover: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly main: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly additional: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["url", "type"];
                                                        readonly properties: {
                                                            readonly url: {
                                                                readonly type: "string";
                                                            };
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                                readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                            };
                                                            readonly typeRaw: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly remainingSupply: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["provider", "rank"];
                                                readonly properties: {
                                                    readonly provider: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                        readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                    };
                                                    readonly rank: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly contractAddress: {
                                            readonly type: "string";
                                        };
                                        readonly tokenId: {
                                            readonly type: "string";
                                        };
                                        readonly standard: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly lastSalePrice: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }, {
                            readonly type: "object";
                            readonly required: readonly ["activityId", "activityType", "bid", "timestamp"];
                            readonly properties: {
                                readonly bid: {
                                    readonly oneOf: readonly [{
                                        readonly type: "object";
                                        readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                        readonly properties: {
                                            readonly kind: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASK", "BID"];
                                                readonly description: "`ASK` `BID`";
                                            };
                                            readonly criteria: {
                                                readonly type: "object";
                                                readonly required: readonly ["assetId"];
                                                readonly properties: {
                                                    readonly assetId: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly id: {
                                                readonly type: "string";
                                            };
                                            readonly status: {
                                                readonly type: "string";
                                                readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                                readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                            };
                                            readonly maker: {
                                                readonly type: "string";
                                            };
                                            readonly price: {
                                                readonly type: "object";
                                                readonly required: readonly ["amount", "currency"];
                                                readonly properties: {
                                                    readonly amount: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["raw"];
                                                        readonly properties: {
                                                            readonly raw: {
                                                                readonly type: "string";
                                                            };
                                                            readonly native: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiat: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly currency: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                        readonly properties: {
                                                            readonly contract: {
                                                                readonly type: "string";
                                                            };
                                                            readonly symbol: {
                                                                readonly type: "string";
                                                            };
                                                            readonly decimals: {
                                                                readonly type: "number";
                                                                readonly minimum: 0;
                                                            };
                                                            readonly displayName: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiatConversion: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "number";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly quantity: {
                                                readonly type: "object";
                                                readonly required: readonly ["filled", "remaining"];
                                                readonly properties: {
                                                    readonly filled: {
                                                        readonly type: "string";
                                                    };
                                                    readonly remaining: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly expiry: {
                                                readonly type: "object";
                                                readonly required: readonly ["validUntil"];
                                                readonly properties: {
                                                    readonly validFrom: {
                                                        readonly type: "string";
                                                    };
                                                    readonly validUntil: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly source: {
                                                readonly type: "string";
                                                readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                                readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                            };
                                            readonly fees: {
                                                readonly type: "object";
                                                readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                                readonly properties: {
                                                    readonly royaltyBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly makerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly takerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly lpFeeBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                };
                                            };
                                            readonly createdAt: {
                                                readonly type: "string";
                                            };
                                            readonly updatedAt: {
                                                readonly type: "string";
                                            };
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                            };
                                            readonly protocol: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ERC721", "ERC1155"];
                                                readonly description: "`ERC721` `ERC1155`";
                                            };
                                            readonly contract: {
                                                readonly type: "string";
                                            };
                                            readonly contractData: {
                                                readonly type: "object";
                                                readonly required: readonly ["orderContractKind"];
                                                readonly properties: {
                                                    readonly orderContractKind: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                                readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                            };
                                        };
                                    }, {
                                        readonly type: "object";
                                        readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                        readonly properties: {
                                            readonly kind: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASK", "BID"];
                                                readonly description: "`ASK` `BID`";
                                            };
                                            readonly criteria: {
                                                readonly type: "object";
                                                readonly required: readonly ["collectionId"];
                                                readonly properties: {
                                                    readonly collectionId: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly id: {
                                                readonly type: "string";
                                            };
                                            readonly status: {
                                                readonly type: "string";
                                                readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                                readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                            };
                                            readonly maker: {
                                                readonly type: "string";
                                            };
                                            readonly price: {
                                                readonly type: "object";
                                                readonly required: readonly ["amount", "currency"];
                                                readonly properties: {
                                                    readonly amount: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["raw"];
                                                        readonly properties: {
                                                            readonly raw: {
                                                                readonly type: "string";
                                                            };
                                                            readonly native: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiat: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly currency: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                        readonly properties: {
                                                            readonly contract: {
                                                                readonly type: "string";
                                                            };
                                                            readonly symbol: {
                                                                readonly type: "string";
                                                            };
                                                            readonly decimals: {
                                                                readonly type: "number";
                                                                readonly minimum: 0;
                                                            };
                                                            readonly displayName: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiatConversion: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "number";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly quantity: {
                                                readonly type: "object";
                                                readonly required: readonly ["filled", "remaining"];
                                                readonly properties: {
                                                    readonly filled: {
                                                        readonly type: "string";
                                                    };
                                                    readonly remaining: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly expiry: {
                                                readonly type: "object";
                                                readonly required: readonly ["validUntil"];
                                                readonly properties: {
                                                    readonly validFrom: {
                                                        readonly type: "string";
                                                    };
                                                    readonly validUntil: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly source: {
                                                readonly type: "string";
                                                readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                                readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                            };
                                            readonly fees: {
                                                readonly type: "object";
                                                readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                                readonly properties: {
                                                    readonly royaltyBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly makerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly takerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly lpFeeBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                };
                                            };
                                            readonly createdAt: {
                                                readonly type: "string";
                                            };
                                            readonly updatedAt: {
                                                readonly type: "string";
                                            };
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                            };
                                            readonly protocol: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ERC721", "ERC1155"];
                                                readonly description: "`ERC721` `ERC1155`";
                                            };
                                            readonly contract: {
                                                readonly type: "string";
                                            };
                                            readonly contractData: {
                                                readonly type: "object";
                                                readonly required: readonly ["orderContractKind"];
                                                readonly properties: {
                                                    readonly orderContractKind: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                                readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                            };
                                        };
                                    }, {
                                        readonly type: "object";
                                        readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                        readonly properties: {
                                            readonly kind: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASK", "BID"];
                                                readonly description: "`ASK` `BID`";
                                            };
                                            readonly criteria: {
                                                readonly type: "object";
                                                readonly required: readonly ["collectionId", "attributes"];
                                                readonly properties: {
                                                    readonly collectionId: {
                                                        readonly type: "string";
                                                    };
                                                    readonly attributes: {
                                                        readonly type: "array";
                                                        readonly minItems: 1;
                                                        readonly items: {
                                                            readonly type: "object";
                                                            readonly required: readonly ["name", "value"];
                                                            readonly properties: {
                                                                readonly name: {
                                                                    readonly type: "string";
                                                                };
                                                                readonly value: {
                                                                    readonly oneOf: readonly [{
                                                                        readonly type: "string";
                                                                    }, {
                                                                        readonly type: "number";
                                                                    }];
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly id: {
                                                readonly type: "string";
                                            };
                                            readonly status: {
                                                readonly type: "string";
                                                readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                                readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                            };
                                            readonly maker: {
                                                readonly type: "string";
                                            };
                                            readonly price: {
                                                readonly type: "object";
                                                readonly required: readonly ["amount", "currency"];
                                                readonly properties: {
                                                    readonly amount: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["raw"];
                                                        readonly properties: {
                                                            readonly raw: {
                                                                readonly type: "string";
                                                            };
                                                            readonly native: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiat: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "string";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                    readonly currency: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                        readonly properties: {
                                                            readonly contract: {
                                                                readonly type: "string";
                                                            };
                                                            readonly symbol: {
                                                                readonly type: "string";
                                                            };
                                                            readonly decimals: {
                                                                readonly type: "number";
                                                                readonly minimum: 0;
                                                            };
                                                            readonly displayName: {
                                                                readonly type: "string";
                                                            };
                                                            readonly fiatConversion: {
                                                                readonly type: "object";
                                                                readonly properties: {
                                                                    readonly usd: {
                                                                        readonly type: "number";
                                                                    };
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly quantity: {
                                                readonly type: "object";
                                                readonly required: readonly ["filled", "remaining"];
                                                readonly properties: {
                                                    readonly filled: {
                                                        readonly type: "string";
                                                    };
                                                    readonly remaining: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly expiry: {
                                                readonly type: "object";
                                                readonly required: readonly ["validUntil"];
                                                readonly properties: {
                                                    readonly validFrom: {
                                                        readonly type: "string";
                                                    };
                                                    readonly validUntil: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly source: {
                                                readonly type: "string";
                                                readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                                readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                            };
                                            readonly fees: {
                                                readonly type: "object";
                                                readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                                readonly properties: {
                                                    readonly royaltyBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly makerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly takerMarketplaceBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                    readonly lpFeeBp: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                        readonly maximum: 10000;
                                                    };
                                                };
                                            };
                                            readonly createdAt: {
                                                readonly type: "string";
                                            };
                                            readonly updatedAt: {
                                                readonly type: "string";
                                            };
                                            readonly chain: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                            };
                                            readonly protocol: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ERC721", "ERC1155"];
                                                readonly description: "`ERC721` `ERC1155`";
                                            };
                                            readonly contract: {
                                                readonly type: "string";
                                            };
                                            readonly contractData: {
                                                readonly type: "object";
                                                readonly required: readonly ["orderContractKind"];
                                                readonly properties: {
                                                    readonly orderContractKind: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                            readonly type: {
                                                readonly type: "string";
                                                readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                                readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                            };
                                        };
                                    }];
                                    readonly type: "object";
                                    readonly required: readonly ["type"];
                                };
                                readonly activityType: {
                                    readonly type: "string";
                                    readonly enum: readonly ["ASK_CREATED", "ASK_CANCELLED", "BID_CREATED", "BID_CANCELLED", "BURN", "MINT", "TRANSFER", "TRADE"];
                                    readonly description: "`ASK_CREATED` `ASK_CANCELLED` `BID_CREATED` `BID_CANCELLED` `BURN` `MINT` `TRANSFER` `TRADE`";
                                };
                                readonly activityId: {
                                    readonly type: "string";
                                };
                                readonly timestamp: {
                                    readonly type: "string";
                                };
                                readonly collection: {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                            readonly description: "i.e. collection slug";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly media: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly url: {
                                                    readonly type: "string";
                                                };
                                                readonly mimeType: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly social: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly twitterUsername: {
                                                    readonly type: "string";
                                                };
                                                readonly discordUrl: {
                                                    readonly type: "string";
                                                };
                                                readonly websiteUrl: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly verification: {
                                            readonly type: "string";
                                            readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                            readonly description: "`VERIFIED` `UNVERIFIED`";
                                        };
                                        readonly isTradeable: {
                                            readonly type: "boolean";
                                        };
                                        readonly royalty: {
                                            readonly type: "object";
                                            readonly required: readonly ["recipient", "bps", "isOptional"];
                                            readonly properties: {
                                                readonly recipient: {
                                                    readonly type: "string";
                                                };
                                                readonly bps: {
                                                    readonly type: "number";
                                                    readonly maximum: 10000;
                                                    readonly minimum: 0;
                                                };
                                                readonly isOptional: {
                                                    readonly type: "boolean";
                                                };
                                            };
                                        };
                                        readonly collectionType: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly isSeaportV16Disabled: {
                                            readonly type: "boolean";
                                        };
                                        readonly isSeaportV16RoyaltyOptional: {
                                            readonly type: "boolean";
                                        };
                                        readonly seaportV16ListingCurrencies: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["address", "name", "symbol", "decimals"];
                                                readonly properties: {
                                                    readonly address: {
                                                        readonly type: "string";
                                                    };
                                                    readonly name: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly chainData: {
                                            readonly type: "object";
                                            readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                            readonly properties: {
                                                readonly contract: {
                                                    readonly type: "string";
                                                };
                                                readonly transferability: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                                    readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                                };
                                                readonly collectionBidSupported: {
                                                    readonly type: "boolean";
                                                };
                                                readonly contractDeployedAt: {
                                                    readonly type: "string";
                                                };
                                                readonly isMinting: {
                                                    readonly type: "boolean";
                                                };
                                                readonly owner: {
                                                    readonly type: "string";
                                                };
                                                readonly mintConfig: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                                    readonly properties: {
                                                        readonly maxSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly totalSupply: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "string";
                                                        };
                                                        readonly baseURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly contractURI: {
                                                            readonly type: "string";
                                                        };
                                                        readonly stages: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "object";
                                                                readonly required: readonly ["kind", "price"];
                                                                readonly properties: {
                                                                    readonly kind: {
                                                                        readonly type: "string";
                                                                        readonly enum: readonly ["public", "allowlist"];
                                                                        readonly description: "`public` `allowlist`";
                                                                    };
                                                                    readonly price: {
                                                                        readonly type: "object";
                                                                        readonly required: readonly ["currency", "raw"];
                                                                        readonly properties: {
                                                                            readonly currency: {
                                                                                readonly type: "object";
                                                                                readonly required: readonly ["chain", "assetId"];
                                                                                readonly properties: {
                                                                                    readonly chain: {
                                                                                        readonly type: "string";
                                                                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                                    };
                                                                                    readonly assetId: {
                                                                                        readonly type: "string";
                                                                                    };
                                                                                };
                                                                            };
                                                                            readonly raw: {
                                                                                readonly type: "string";
                                                                            };
                                                                        };
                                                                    };
                                                                    readonly startTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly endTime: {
                                                                        readonly type: "string";
                                                                    };
                                                                    readonly walletLimit: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 0;
                                                                        readonly maximum: 1000;
                                                                    };
                                                                    readonly maxSupply: {
                                                                        readonly type: "number";
                                                                        readonly minimum: 1;
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        readonly payoutRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyRecipient: {
                                                            readonly type: "string";
                                                        };
                                                        readonly royaltyBps: {
                                                            readonly type: "string";
                                                        };
                                                        readonly mintFee: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                                readonly asset: {
                                    readonly type: "object";
                                    readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                                    readonly properties: {
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly collectionId: {
                                            readonly type: "string";
                                        };
                                        readonly owner: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly description: {
                                            readonly type: "string";
                                        };
                                        readonly assetClass: {
                                            readonly type: "string";
                                            readonly enum: readonly ["NFT", "SFT"];
                                            readonly description: "`NFT` `SFT`";
                                        };
                                        readonly attributes: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["traitType", "value"];
                                                readonly properties: {
                                                    readonly traitType: {
                                                        readonly type: "string";
                                                    };
                                                    readonly value: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                        readonly mediaV2: {
                                            readonly type: "object";
                                            readonly required: readonly ["main"];
                                            readonly properties: {
                                                readonly cover: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly main: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["url", "type"];
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                };
                                                readonly additional: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["url", "type"];
                                                        readonly properties: {
                                                            readonly url: {
                                                                readonly type: "string";
                                                            };
                                                            readonly type: {
                                                                readonly type: "string";
                                                                readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                                readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                            };
                                                            readonly typeRaw: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly remainingSupply: {
                                            readonly type: "string";
                                        };
                                        readonly rarity: {
                                            readonly type: "array";
                                            readonly items: {
                                                readonly type: "object";
                                                readonly required: readonly ["provider", "rank"];
                                                readonly properties: {
                                                    readonly provider: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                        readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                    };
                                                    readonly rank: {
                                                        readonly type: "number";
                                                    };
                                                };
                                            };
                                        };
                                        readonly contractAddress: {
                                            readonly type: "string";
                                        };
                                        readonly tokenId: {
                                            readonly type: "string";
                                        };
                                        readonly standard: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly lastSalePrice: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }];
                    };
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly description: "used to get next offset of items";
                };
            };
            readonly required: readonly ["activities"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetUserAssets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly chain: {
                    readonly type: "string";
                    readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly "walletAddresses[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly minItems: 1;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The wallet address (user address) to query assets from, could be a list, example: `0x47d88afbba889709abba07339ed1c88079944ca3`";
                };
                readonly "assetIds[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter assets by ids. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0`";
                };
                readonly "collectionIds[]": {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly maxItems: 40;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Filter assets by collectionIds. example: `0xbd3531da5cf5857e7cfaa92426877b022e612cf8`";
                };
                readonly onlyListed: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Whether to show only listed assets, default to __false__";
                };
                readonly includeTopBid: {
                    readonly type: "boolean";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Whether to include top bid for returned assets, default to __false__";
                };
                readonly sortBy: {
                    readonly type: "string";
                    readonly enum: readonly ["listingPrice", "listedAt", "receivedAt", "lastSalePrice"];
                    readonly default: "receivedAt";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly sortDir: {
                    readonly type: "string";
                    readonly enum: readonly ["asc", "desc"];
                    readonly default: "desc";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly default: 20;
                    readonly minimum: 1;
                    readonly maximum: 100;
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Amount of items returned, default to __20__";
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "Use continuation token to request next offset of assets.";
                };
            };
            readonly required: readonly ["chain", "walletAddresses[]"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly assets: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly asset: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly chain: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly collectionId: {
                                        readonly type: "string";
                                    };
                                    readonly owner: {
                                        readonly type: "string";
                                    };
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly assetClass: {
                                        readonly type: "string";
                                        readonly enum: readonly ["NFT", "SFT"];
                                        readonly description: "`NFT` `SFT`";
                                    };
                                    readonly attributes: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly traitType: {
                                                    readonly type: "string";
                                                };
                                                readonly value: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly required: readonly ["traitType", "value"];
                                        };
                                    };
                                    readonly mediaV2: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly cover: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                        readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                    };
                                                    readonly typeRaw: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["url", "type"];
                                            };
                                            readonly main: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly url: {
                                                        readonly type: "string";
                                                    };
                                                    readonly type: {
                                                        readonly type: "string";
                                                        readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                        readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                    };
                                                    readonly typeRaw: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly required: readonly ["url", "type"];
                                            };
                                            readonly additional: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly url: {
                                                            readonly type: "string";
                                                        };
                                                        readonly type: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["img", "video", "html", "model", "audio", "text", "pdf"];
                                                            readonly description: "`img` `video` `html` `model` `audio` `text` `pdf`";
                                                        };
                                                        readonly typeRaw: {
                                                            readonly type: "string";
                                                        };
                                                    };
                                                    readonly required: readonly ["url", "type"];
                                                };
                                            };
                                        };
                                        readonly required: readonly ["main"];
                                    };
                                    readonly remainingSupply: {
                                        readonly type: "string";
                                    };
                                    readonly rarity: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly provider: {
                                                    readonly type: "string";
                                                    readonly enum: readonly ["MOONRANK", "HOWRARE", "OPENRARITY", "POPRANK", "ME_STATISTICAL", "MAGICEDEN"];
                                                    readonly description: "`MOONRANK` `HOWRARE` `OPENRARITY` `POPRANK` `ME_STATISTICAL` `MAGICEDEN`";
                                                };
                                                readonly rank: {
                                                    readonly type: "number";
                                                };
                                            };
                                            readonly required: readonly ["provider", "rank"];
                                        };
                                    };
                                    readonly contractAddress: {
                                        readonly type: "string";
                                    };
                                    readonly tokenId: {
                                        readonly type: "string";
                                    };
                                    readonly standard: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ERC721", "ERC1155"];
                                        readonly description: "`ERC721` `ERC1155`";
                                    };
                                    readonly lastSalePrice: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly amount: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly raw: {
                                                        readonly type: "string";
                                                    };
                                                    readonly native: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiat: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["raw"];
                                            };
                                            readonly currency: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly contract: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                    };
                                                    readonly displayName: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiatConversion: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "number";
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                            };
                                        };
                                        readonly required: readonly ["amount", "currency"];
                                    };
                                };
                                readonly required: readonly ["id", "collectionId", "assetClass", "rarity", "contractAddress", "tokenId", "standard"];
                            };
                            readonly floorAsk: {
                                readonly type: "object";
                                readonly required: readonly ["assetId", "chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                readonly properties: {
                                    readonly assetId: {
                                        readonly type: "string";
                                    };
                                    readonly id: {
                                        readonly type: "string";
                                    };
                                    readonly kind: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ASK", "BID"];
                                        readonly description: "`ASK` `BID`";
                                    };
                                    readonly status: {
                                        readonly type: "string";
                                        readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                        readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                    };
                                    readonly maker: {
                                        readonly type: "string";
                                    };
                                    readonly price: {
                                        readonly type: "object";
                                        readonly required: readonly ["amount", "currency"];
                                        readonly properties: {
                                            readonly amount: {
                                                readonly type: "object";
                                                readonly required: readonly ["raw"];
                                                readonly properties: {
                                                    readonly raw: {
                                                        readonly type: "string";
                                                    };
                                                    readonly native: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiat: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly currency: {
                                                readonly type: "object";
                                                readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                readonly properties: {
                                                    readonly contract: {
                                                        readonly type: "string";
                                                    };
                                                    readonly symbol: {
                                                        readonly type: "string";
                                                    };
                                                    readonly decimals: {
                                                        readonly type: "number";
                                                        readonly minimum: 0;
                                                    };
                                                    readonly displayName: {
                                                        readonly type: "string";
                                                    };
                                                    readonly fiatConversion: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly usd: {
                                                                readonly type: "number";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                    readonly quantity: {
                                        readonly type: "object";
                                        readonly required: readonly ["filled", "remaining"];
                                        readonly properties: {
                                            readonly filled: {
                                                readonly type: "string";
                                            };
                                            readonly remaining: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly expiry: {
                                        readonly type: "object";
                                        readonly required: readonly ["validUntil"];
                                        readonly properties: {
                                            readonly validFrom: {
                                                readonly type: "string";
                                            };
                                            readonly validUntil: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly source: {
                                        readonly type: "string";
                                        readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                        readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                    };
                                    readonly fees: {
                                        readonly type: "object";
                                        readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                        readonly properties: {
                                            readonly royaltyBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly makerMarketplaceBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly takerMarketplaceBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                            readonly lpFeeBp: {
                                                readonly type: "number";
                                                readonly minimum: 0;
                                                readonly maximum: 10000;
                                            };
                                        };
                                    };
                                    readonly createdAt: {
                                        readonly type: "string";
                                    };
                                    readonly updatedAt: {
                                        readonly type: "string";
                                    };
                                    readonly chain: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                        readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                    };
                                    readonly protocol: {
                                        readonly type: "string";
                                        readonly enum: readonly ["ERC721", "ERC1155"];
                                        readonly description: "`ERC721` `ERC1155`";
                                    };
                                    readonly contract: {
                                        readonly type: "string";
                                    };
                                    readonly contractData: {
                                        readonly type: "object";
                                        readonly required: readonly ["orderContractKind"];
                                        readonly properties: {
                                            readonly orderContractKind: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly topBid: {
                                readonly oneOf: readonly [{
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["assetId"];
                                            readonly properties: {
                                                readonly assetId: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }, {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["collectionId"];
                                            readonly properties: {
                                                readonly collectionId: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }, {
                                    readonly type: "object";
                                    readonly required: readonly ["chain", "contract", "contractData", "createdAt", "fees", "id", "kind", "maker", "price", "protocol", "quantity", "source", "status"];
                                    readonly properties: {
                                        readonly kind: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASK", "BID"];
                                            readonly description: "`ASK` `BID`";
                                        };
                                        readonly criteria: {
                                            readonly type: "object";
                                            readonly required: readonly ["collectionId", "attributes"];
                                            readonly properties: {
                                                readonly collectionId: {
                                                    readonly type: "string";
                                                };
                                                readonly attributes: {
                                                    readonly type: "array";
                                                    readonly minItems: 1;
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly required: readonly ["name", "value"];
                                                        readonly properties: {
                                                            readonly name: {
                                                                readonly type: "string";
                                                            };
                                                            readonly value: {
                                                                readonly oneOf: readonly [{
                                                                    readonly type: "string";
                                                                }, {
                                                                    readonly type: "number";
                                                                }];
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly id: {
                                            readonly type: "string";
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly enum: readonly ["active", "inactive", "expired", "filled", "cancelled"];
                                            readonly description: "`active` `inactive` `expired` `filled` `cancelled`";
                                        };
                                        readonly maker: {
                                            readonly type: "string";
                                        };
                                        readonly price: {
                                            readonly type: "object";
                                            readonly required: readonly ["amount", "currency"];
                                            readonly properties: {
                                                readonly amount: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["raw"];
                                                    readonly properties: {
                                                        readonly raw: {
                                                            readonly type: "string";
                                                        };
                                                        readonly native: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiat: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                                readonly currency: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["contract", "symbol", "decimals", "displayName"];
                                                    readonly properties: {
                                                        readonly contract: {
                                                            readonly type: "string";
                                                        };
                                                        readonly symbol: {
                                                            readonly type: "string";
                                                        };
                                                        readonly decimals: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                        };
                                                        readonly displayName: {
                                                            readonly type: "string";
                                                        };
                                                        readonly fiatConversion: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly usd: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                        readonly quantity: {
                                            readonly type: "object";
                                            readonly required: readonly ["filled", "remaining"];
                                            readonly properties: {
                                                readonly filled: {
                                                    readonly type: "string";
                                                };
                                                readonly remaining: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly expiry: {
                                            readonly type: "object";
                                            readonly required: readonly ["validUntil"];
                                            readonly properties: {
                                                readonly validFrom: {
                                                    readonly type: "string";
                                                };
                                                readonly validUntil: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly source: {
                                            readonly type: "string";
                                            readonly enum: readonly ["MAGICEDEN", "OPENSEA", "IXS_SERVICE"];
                                            readonly description: "`MAGICEDEN` `OPENSEA` `IXS_SERVICE`";
                                        };
                                        readonly fees: {
                                            readonly type: "object";
                                            readonly required: readonly ["royaltyBp", "makerMarketplaceBp", "takerMarketplaceBp", "lpFeeBp"];
                                            readonly properties: {
                                                readonly royaltyBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly makerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly takerMarketplaceBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                                readonly lpFeeBp: {
                                                    readonly type: "number";
                                                    readonly minimum: 0;
                                                    readonly maximum: 10000;
                                                };
                                            };
                                        };
                                        readonly createdAt: {
                                            readonly type: "string";
                                        };
                                        readonly updatedAt: {
                                            readonly type: "string";
                                        };
                                        readonly chain: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                        };
                                        readonly protocol: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ERC721", "ERC1155"];
                                            readonly description: "`ERC721` `ERC1155`";
                                        };
                                        readonly contract: {
                                            readonly type: "string";
                                        };
                                        readonly contractData: {
                                            readonly type: "object";
                                            readonly required: readonly ["orderContractKind"];
                                            readonly properties: {
                                                readonly orderContractKind: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly type: {
                                            readonly type: "string";
                                            readonly enum: readonly ["ASSET", "COLLECTION", "ATTRIBUTE"];
                                            readonly description: "`ASSET` `COLLECTION` `ATTRIBUTE`";
                                        };
                                    };
                                }];
                                readonly type: "object";
                                readonly required: readonly ["type"];
                            };
                        };
                        readonly required: readonly ["asset", "ownership"];
                    };
                };
                readonly continuation: {
                    readonly type: "string";
                    readonly description: "used to get next offset of items";
                };
            };
            readonly required: readonly ["assets"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetUserCollections: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly walletAddresses: {
                readonly description: "a list of user wallet address to query collection stats from. example: `0x47d88afbba889709abba07339ed1c88079944ca3` ";
                readonly type: "array";
                readonly maxItems: 100;
                readonly items: {
                    readonly type: "string";
                };
            };
        };
        readonly required: readonly ["walletAddresses"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly collections: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly required: readonly ["chain", "collectionType", "id", "isTradeable", "listedCount", "name", "ownedCount", "verification"];
                        readonly properties: {
                            readonly chain: {
                                readonly type: "string";
                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                            };
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly symbol: {
                                readonly type: "string";
                                readonly description: "i.e. collection slug";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly media: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly mimeType: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly social: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly twitterUsername: {
                                        readonly type: "string";
                                    };
                                    readonly discordUrl: {
                                        readonly type: "string";
                                    };
                                    readonly websiteUrl: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly verification: {
                                readonly type: "string";
                                readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                readonly description: "`VERIFIED` `UNVERIFIED`";
                            };
                            readonly isTradeable: {
                                readonly type: "boolean";
                            };
                            readonly royalty: {
                                readonly type: "object";
                                readonly required: readonly ["recipient", "bps", "isOptional"];
                                readonly properties: {
                                    readonly recipient: {
                                        readonly type: "string";
                                    };
                                    readonly bps: {
                                        readonly type: "number";
                                        readonly maximum: 10000;
                                        readonly minimum: 0;
                                    };
                                    readonly isOptional: {
                                        readonly type: "boolean";
                                    };
                                };
                            };
                            readonly collectionType: {
                                readonly type: "string";
                                readonly enum: readonly ["ERC721", "ERC1155"];
                                readonly description: "`ERC721` `ERC1155`";
                            };
                            readonly isSeaportV16Disabled: {
                                readonly type: "boolean";
                            };
                            readonly isSeaportV16RoyaltyOptional: {
                                readonly type: "boolean";
                            };
                            readonly seaportV16ListingCurrencies: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly required: readonly ["address", "name", "symbol", "decimals"];
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                            };
                            readonly chainData: {
                                readonly type: "object";
                                readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                                readonly properties: {
                                    readonly contract: {
                                        readonly type: "string";
                                    };
                                    readonly transferability: {
                                        readonly type: "string";
                                        readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                        readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                    };
                                    readonly collectionBidSupported: {
                                        readonly type: "boolean";
                                    };
                                    readonly contractDeployedAt: {
                                        readonly type: "string";
                                    };
                                    readonly isMinting: {
                                        readonly type: "boolean";
                                    };
                                    readonly owner: {
                                        readonly type: "string";
                                    };
                                    readonly mintConfig: {
                                        readonly type: "object";
                                        readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                        readonly properties: {
                                            readonly maxSupply: {
                                                readonly type: "string";
                                            };
                                            readonly totalSupply: {
                                                readonly type: "string";
                                            };
                                            readonly walletLimit: {
                                                readonly type: "string";
                                            };
                                            readonly baseURI: {
                                                readonly type: "string";
                                            };
                                            readonly contractURI: {
                                                readonly type: "string";
                                            };
                                            readonly stages: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly required: readonly ["kind", "price"];
                                                    readonly properties: {
                                                        readonly kind: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["public", "allowlist"];
                                                            readonly description: "`public` `allowlist`";
                                                        };
                                                        readonly price: {
                                                            readonly type: "object";
                                                            readonly required: readonly ["currency", "raw"];
                                                            readonly properties: {
                                                                readonly currency: {
                                                                    readonly type: "object";
                                                                    readonly required: readonly ["chain", "assetId"];
                                                                    readonly properties: {
                                                                        readonly chain: {
                                                                            readonly type: "string";
                                                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                        };
                                                                        readonly assetId: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                };
                                                                readonly raw: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                        };
                                                        readonly startTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                            readonly maximum: 1000;
                                                        };
                                                        readonly maxSupply: {
                                                            readonly type: "number";
                                                            readonly minimum: 1;
                                                        };
                                                    };
                                                };
                                            };
                                            readonly payoutRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyBps: {
                                                readonly type: "string";
                                            };
                                            readonly mintFee: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                };
                            };
                            readonly ownedCount: {
                                readonly type: "number";
                                readonly minimum: 0;
                            };
                            readonly listedCount: {
                                readonly type: "number";
                                readonly minimum: 0;
                            };
                        };
                    };
                };
            };
            readonly required: readonly ["collections"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsBidGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly maker: {
                readonly type: "string";
                readonly description: "Bid maker";
                readonly examples: readonly ["0x079e5e1ac85b04225edad793ecdd9b31a26fdacc"];
            };
            readonly offers: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly quantity: {
                            readonly type: "number";
                            readonly description: "Bid quantity";
                            readonly minimum: 1;
                        };
                        readonly unitPrice: {
                            readonly description: "Unit price per quantity";
                            readonly type: "object";
                            readonly properties: {
                                readonly currency: {
                                    readonly type: "string";
                                    readonly description: "on-chain currency id";
                                    readonly examples: readonly ["0x0000000000000000000000000000000000000000"];
                                };
                                readonly raw: {
                                    readonly type: "string";
                                    readonly description: "price with on-chain currency in its decimal format. e.g. `0x0000000000000000000000000000000000000000` stands for ETH in ethereum, so to specify 1 ETH (deicmals == 18), you should input `1000000000000000000`";
                                    readonly examples: readonly ["1000000000000000000"];
                                };
                            };
                            readonly required: readonly ["currency", "raw"];
                        };
                        readonly expirationInSeconds: {
                            readonly type: "number";
                            readonly description: "Expiration time (in seconds). Min: 15 minutes, Max: 1 year";
                            readonly minimum: 900;
                            readonly maximum: 31536000;
                        };
                        readonly collectionId: {
                            readonly type: "string";
                            readonly description: "Collection id which this bid against to. If this is present, means this is a collection offer";
                            readonly examples: readonly ["0xbd3531da5cf5857e7cfaa92426877b022e612cf8"];
                        };
                        readonly assetId: {
                            readonly type: "string";
                            readonly description: "Specify asset id for bidding, could be a ERC-721 or ERC-1155. If this is present, means this is an asset(token) offer";
                            readonly examples: readonly ["0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0"];
                        };
                        readonly attribute: {
                            readonly type: "object";
                            readonly properties: {
                                readonly key: {
                                    readonly type: "string";
                                };
                                readonly value: {
                                    readonly type: "string";
                                };
                            };
                            readonly description: "Specify an attribute this bid against to which means this is an attribute offer";
                        };
                    };
                    readonly required: readonly ["quantity", "unitPrice", "expirationInSeconds"];
                };
                readonly minItems: 1;
                readonly maxItems: 10;
                readonly description: "Bids to generate from this maker";
            };
        };
        readonly required: readonly ["chain", "maker", "offers"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["dataToSignAndPostList", "status"];
                readonly properties: {
                    readonly erc20CurrencyApprovalsNeeded: {
                        readonly description: "ERC-20 token approvals needed to be signed before bids generation. This is for delegating MagicEden to move user's ERC-20 balances when bids are fulfilled";
                        readonly type: "object";
                        readonly required: readonly ["transactionsDataToSignAndCast"];
                        readonly properties: {
                            readonly transactionsDataToSignAndCast: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly description: "EVM transaction data structure";
                                    readonly required: readonly ["from", "to"];
                                    readonly properties: {
                                        readonly from: {
                                            readonly type: "string";
                                            readonly description: "Transaction issuer: from whom sends this transaction";
                                            readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                        };
                                        readonly to: {
                                            readonly type: "string";
                                            readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                            readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                        };
                                        readonly data: {
                                            readonly type: "string";
                                            readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                            readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly dataToSignAndPostList: {
                        readonly type: "array";
                        readonly description: "Array of bid data to sign and post to bid creation API endpoint, you should call bid creation API endpoint for every item in this list with signed signature and post body";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly bidDataToSign: {
                                    readonly type: "object";
                                    readonly description: "Standard EIP-712 signature data for signing and generate signature, once signature is generated, signer usually should pass signature along with `postBody` to another API endpoint";
                                    readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                    readonly properties: {
                                        readonly signatureKind: {
                                            readonly type: "string";
                                        };
                                        readonly domain: {
                                            readonly type: "object";
                                            readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                            readonly properties: {
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly version: {
                                                    readonly type: "string";
                                                };
                                                readonly chainId: {
                                                    readonly type: "number";
                                                };
                                                readonly verifyingContract: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly types: {};
                                        readonly value: {};
                                        readonly primaryType: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly postBody: {
                                    readonly type: "string";
                                    readonly description: "Base64 encoded data that need to be pass to creation API endpoint";
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsBidPost: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly postBody: {
                readonly type: "string";
                readonly description: "Base64-encoded string stands for post body, which should come from signing data generation API endpoint";
            };
            readonly signature: {
                readonly type: "string";
                readonly description: "Hex-ed string stands for signaure, which should come from signing data generation API endpoint";
            };
        };
        readonly required: readonly ["chain", "postBody", "signature"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["createdOrderIds", "status"];
                readonly properties: {
                    readonly createdOrderIds: {
                        readonly type: "array";
                        readonly description: "created bid ids";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsBulkTransferGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly from: {
                readonly type: "string";
                readonly description: "from which address these assets will be transferred out";
            };
            readonly to: {
                readonly type: "string";
                readonly description: "to which address these assets will be transferred in";
            };
            readonly assets: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly assetId: {
                            readonly type: "string";
                        };
                        readonly quantity: {
                            readonly type: "number";
                            readonly minimum: 1;
                        };
                    };
                    readonly required: readonly ["assetId", "quantity"];
                };
                readonly minItems: 1;
                readonly maxItems: 10;
                readonly description: "Assets to transfer";
            };
        };
        readonly required: readonly ["chain", "from", "to", "assets"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["status", "transferTransactionsToSign"];
                readonly properties: {
                    readonly contractApprovalsNeeded: {
                        readonly description: "Contract approvals needed to be signed before transferring. This is for delegating MagicEden to move user's assets when transferring";
                        readonly type: "object";
                        readonly required: readonly ["transactionsDataToSignAndCast"];
                        readonly properties: {
                            readonly transactionsDataToSignAndCast: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly description: "EVM transaction data structure";
                                    readonly required: readonly ["from", "to"];
                                    readonly properties: {
                                        readonly from: {
                                            readonly type: "string";
                                            readonly description: "Transaction issuer: from whom sends this transaction";
                                            readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                        };
                                        readonly to: {
                                            readonly type: "string";
                                            readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                            readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                        };
                                        readonly data: {
                                            readonly type: "string";
                                            readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                            readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly transferTransactionsToSign: {
                        readonly type: "array";
                        readonly description: "Array of transfer transaction data to sign. Once signed, please broadcast signed transactions to EVM network to finish transfer";
                        readonly items: {
                            readonly type: "object";
                            readonly description: "EVM transaction data structure";
                            readonly required: readonly ["from", "to"];
                            readonly properties: {
                                readonly from: {
                                    readonly type: "string";
                                    readonly description: "Transaction issuer: from whom sends this transaction";
                                    readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                };
                                readonly to: {
                                    readonly type: "string";
                                    readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                    readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                };
                                readonly data: {
                                    readonly type: "string";
                                    readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                };
                                readonly value: {
                                    readonly type: "string";
                                    readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsBuyGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly taker: {
                readonly type: "string";
                readonly description: "Taker who wish to buy assets";
                readonly examples: readonly ["0x079e5e1ac85b04225edad793ecdd9b31a26fdacc"];
            };
            readonly currency: {
                readonly type: "string";
                readonly description: "Listing currency which this taker wants to buy";
                readonly examples: readonly ["0x0000000000000000000000000000000000000000"];
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly assetId: {
                            readonly type: "string";
                        };
                        readonly quantity: {
                            readonly type: "number";
                            readonly minimum: 1;
                        };
                    };
                    readonly required: readonly ["assetId", "quantity"];
                };
                readonly minItems: 1;
                readonly maxItems: 10;
                readonly description: "Assets to buy";
            };
        };
        readonly required: readonly ["chain", "taker", "assets"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["buyTransactionsToSign", "status"];
                readonly properties: {
                    readonly erc20CurrencyApprovalsNeeded: {
                        readonly description: "ERC-20 token approvals needed to be signed before buying. This is for delegating MagicEden to move user's ERC-20 balances for buying";
                        readonly type: "object";
                        readonly required: readonly ["transactionsDataToSignAndCast"];
                        readonly properties: {
                            readonly transactionsDataToSignAndCast: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly description: "EVM transaction data structure";
                                    readonly required: readonly ["from", "to"];
                                    readonly properties: {
                                        readonly from: {
                                            readonly type: "string";
                                            readonly description: "Transaction issuer: from whom sends this transaction";
                                            readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                        };
                                        readonly to: {
                                            readonly type: "string";
                                            readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                            readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                        };
                                        readonly data: {
                                            readonly type: "string";
                                            readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                            readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly buyTransactionsToSign: {
                        readonly type: "array";
                        readonly description: "Array of buying transaction data to sign. Once signed, please broadcast signed transactions to EVM network to finish buying";
                        readonly items: {
                            readonly type: "object";
                            readonly description: "EVM transaction data structure";
                            readonly required: readonly ["from", "to"];
                            readonly properties: {
                                readonly from: {
                                    readonly type: "string";
                                    readonly description: "Transaction issuer: from whom sends this transaction";
                                    readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                };
                                readonly to: {
                                    readonly type: "string";
                                    readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                    readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                };
                                readonly data: {
                                    readonly type: "string";
                                    readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                };
                                readonly value: {
                                    readonly type: "string";
                                    readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsCancelOrderGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly maker: {
                readonly type: "string";
                readonly description: "order maker, only support batch cancellation under one maker";
            };
            readonly orderIds: {
                readonly type: "array";
                readonly items: {
                    readonly type: "string";
                };
                readonly minItems: 1;
                readonly maxItems: 100;
                readonly description: "Order ids to cancel";
            };
        };
        readonly required: readonly ["chain", "orderIds", "maker"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["status"];
                readonly properties: {
                    readonly dataToSignAndPostList: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly description: "Order cancellation data to sign. Once signed, you should call the cancellatino API endpoint with signature to finish order cancellation.";
                            readonly properties: {
                                readonly cancelOrderDataToSign: {
                                    readonly type: "object";
                                    readonly description: "Standard EIP-712 signature data for signing and generate signature, once signature is generated, signer usually should pass signature along with `postBody` to another API endpoint";
                                    readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                    readonly properties: {
                                        readonly signatureKind: {
                                            readonly type: "string";
                                        };
                                        readonly domain: {
                                            readonly type: "object";
                                            readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                            readonly properties: {
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly version: {
                                                    readonly type: "string";
                                                };
                                                readonly chainId: {
                                                    readonly type: "number";
                                                };
                                                readonly verifyingContract: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly types: {};
                                        readonly value: {};
                                        readonly primaryType: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly postBody: {
                                    readonly type: "string";
                                    readonly description: "Base64 encoded data that need to be pass to cancellation API endpoint";
                                };
                            };
                        };
                    };
                    readonly onchainCancellationTransactionToSign: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "object";
                            readonly description: "EVM transaction data structure";
                            readonly required: readonly ["from", "to"];
                            readonly properties: {
                                readonly from: {
                                    readonly type: "string";
                                    readonly description: "Transaction issuer: from whom sends this transaction";
                                    readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                };
                                readonly to: {
                                    readonly type: "string";
                                    readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                    readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                };
                                readonly data: {
                                    readonly type: "string";
                                    readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                };
                                readonly value: {
                                    readonly type: "string";
                                    readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsCancelOrderPost: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly postBody: {
                readonly type: "string";
                readonly description: "Base64-encoded string stands for post body, which should come from signing data generation API endpoint";
            };
            readonly signature: {
                readonly type: "string";
                readonly description: "Hex-ed string stands for signaure, which should come from signing data generation API endpoint";
            };
        };
        readonly required: readonly ["chain", "postBody", "signature"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
                readonly required: readonly ["status"];
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsListGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly maker: {
                readonly type: "string";
                readonly description: "listing maker, should be owner of these assets(tokens) that wish to be listed.";
                readonly examples: readonly ["0x079e5e1ac85b04225edad793ecdd9b31a26fdacc"];
            };
            readonly listings: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly assetId: {
                            readonly type: "string";
                            readonly description: "Asset id for listing, could be a ERC-721 or ERC-1155";
                            readonly examples: readonly ["0xbd3531da5cf5857e7cfaa92426877b022e612cf8:0"];
                        };
                        readonly quantity: {
                            readonly type: "number";
                            readonly description: "Asset quantity to list, for ERC-721, must specified 1, for ERC-1155, could be > 1";
                            readonly minimum: 1;
                        };
                        readonly unitPrice: {
                            readonly description: "Unit price per quantity";
                            readonly type: "object";
                            readonly properties: {
                                readonly currency: {
                                    readonly type: "string";
                                    readonly description: "on-chain currency id";
                                    readonly examples: readonly ["0x0000000000000000000000000000000000000000"];
                                };
                                readonly raw: {
                                    readonly type: "string";
                                    readonly description: "price with on-chain currency in its decimal format. e.g. `0x0000000000000000000000000000000000000000` stands for ETH in ethereum, so to specify 1 ETH (deicmals == 18), you should input `1000000000000000000`";
                                    readonly examples: readonly ["1000000000000000000"];
                                };
                            };
                            readonly required: readonly ["currency", "raw"];
                        };
                        readonly royaltyBps: {
                            readonly type: "number";
                            readonly description: "Royalty bps to paid to creator for listing if there are";
                            readonly minimum: 0;
                            readonly maximum: 10000;
                        };
                        readonly expirationInSeconds: {
                            readonly type: "number";
                            readonly description: "Expiration time (in seconds). Min: 15 minutes, Max: 1 year";
                            readonly minimum: 900;
                            readonly maximum: 31536000;
                        };
                    };
                    readonly required: readonly ["assetId", "quantity", "unitPrice", "expirationInSeconds"];
                };
                readonly minItems: 1;
                readonly maxItems: 10;
                readonly description: "listings to generate";
            };
        };
        readonly required: readonly ["chain", "maker", "listings"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly required: readonly ["status", "errors"];
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly description: "errors";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
            }, {
                readonly type: "object";
                readonly required: readonly ["dataToSignAndPostList", "status"];
                readonly properties: {
                    readonly contractApprovalsNeeded: {
                        readonly description: "Contract approvals needed to be signed before listing. This is for delegating MagicEden to move user's assets when listings are fulfilled";
                        readonly type: "object";
                        readonly required: readonly ["transactionsDataToSignAndCast"];
                        readonly properties: {
                            readonly transactionsDataToSignAndCast: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly description: "EVM transaction data structure";
                                    readonly required: readonly ["from", "to"];
                                    readonly properties: {
                                        readonly from: {
                                            readonly type: "string";
                                            readonly description: "Transaction issuer: from whom sends this transaction";
                                            readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                        };
                                        readonly to: {
                                            readonly type: "string";
                                            readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                            readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                        };
                                        readonly data: {
                                            readonly type: "string";
                                            readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                            readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly dataToSignAndPostList: {
                        readonly type: "array";
                        readonly description: "Array of listing data to sign and post to listing creation API endpoint, you should call listing creation API endpoint for every item in this list with signed signature and post body";
                        readonly items: {
                            readonly type: "object";
                            readonly properties: {
                                readonly listingDataToSign: {
                                    readonly type: "object";
                                    readonly description: "Standard EIP-712 signature data for signing and generate signature, once signature is generated, signer usually should pass signature along with `postBody` to another API endpoint";
                                    readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                    readonly properties: {
                                        readonly signatureKind: {
                                            readonly type: "string";
                                        };
                                        readonly domain: {
                                            readonly type: "object";
                                            readonly required: readonly ["name", "version", "chainId", "verifyingContract"];
                                            readonly properties: {
                                                readonly name: {
                                                    readonly type: "string";
                                                };
                                                readonly version: {
                                                    readonly type: "string";
                                                };
                                                readonly chainId: {
                                                    readonly type: "number";
                                                };
                                                readonly verifyingContract: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                        readonly types: {};
                                        readonly value: {};
                                        readonly primaryType: {
                                            readonly type: "string";
                                        };
                                    };
                                };
                                readonly postBody: {
                                    readonly type: "string";
                                    readonly description: "Base64 encoded data that need to be pass to creation API endpoint";
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsListPost: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly postBody: {
                readonly type: "string";
                readonly description: "Base64-encoded string stands for post body, which should come from signing data generation API endpoint";
            };
            readonly signature: {
                readonly type: "string";
                readonly description: "Hex-ed string stands for signaure, which should come from signing data generation API endpoint";
            };
        };
        readonly required: readonly ["chain", "postBody", "signature"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly required: readonly ["status", "errors"];
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly description: "errors";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                };
            }, {
                readonly type: "object";
                readonly required: readonly ["createdOrderIds", "status"];
                readonly properties: {
                    readonly createdOrderIds: {
                        readonly type: "array";
                        readonly description: "created listing ids";
                        readonly items: {
                            readonly type: "string";
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const IxsSellGet: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly taker: {
                readonly type: "string";
                readonly description: "Taker who wish to sell assets";
                readonly examples: readonly ["0x079e5e1ac85b04225edad793ecdd9b31a26fdacc"];
            };
            readonly items: {
                readonly type: "array";
                readonly items: {
                    readonly type: "object";
                    readonly properties: {
                        readonly assetId: {
                            readonly type: "string";
                        };
                        readonly quantity: {
                            readonly type: "number";
                            readonly minimum: 1;
                        };
                    };
                    readonly required: readonly ["assetId", "quantity"];
                };
                readonly minItems: 1;
                readonly maxItems: 10;
                readonly description: "Assets to sell";
            };
        };
        readonly required: readonly ["chain", "taker", "items"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly type: "object";
                readonly properties: {
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["error"];
                        readonly description: "`error`";
                    };
                    readonly errors: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                        };
                        readonly description: "errors";
                    };
                };
                readonly required: readonly ["status", "errors"];
            }, {
                readonly type: "object";
                readonly required: readonly ["sellDetails", "sellTransactionsToSign", "status"];
                readonly properties: {
                    readonly contractApprovalsNeeded: {
                        readonly description: "Contract approvals needed to be signed before listing. This is for delegating MagicEden to move user's assets when selling";
                        readonly type: "object";
                        readonly required: readonly ["transactionsDataToSignAndCast"];
                        readonly properties: {
                            readonly transactionsDataToSignAndCast: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly description: "EVM transaction data structure";
                                    readonly required: readonly ["from", "to"];
                                    readonly properties: {
                                        readonly from: {
                                            readonly type: "string";
                                            readonly description: "Transaction issuer: from whom sends this transaction";
                                            readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                        };
                                        readonly to: {
                                            readonly type: "string";
                                            readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                            readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                        };
                                        readonly data: {
                                            readonly type: "string";
                                            readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                        };
                                        readonly value: {
                                            readonly type: "string";
                                            readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly sellTransactionsToSign: {
                        readonly type: "array";
                        readonly description: "Array of selling transaction data to sign. Once signed, please broadcast signed transactions to EVM network to finish selling";
                        readonly items: {
                            readonly type: "object";
                            readonly description: "EVM transaction data structure";
                            readonly required: readonly ["from", "to"];
                            readonly properties: {
                                readonly from: {
                                    readonly type: "string";
                                    readonly description: "Transaction issuer: from whom sends this transaction";
                                    readonly examples: readonly ["0x78d25e7beb6e7ae84859f2df6fd739b9eab231ec"];
                                };
                                readonly to: {
                                    readonly type: "string";
                                    readonly description: "Transaction destination: to where this transaction shall be executed, usually a EVM smart contract address";
                                    readonly examples: readonly ["0x3334fd65540a19cf92bee834da65d2316c55c348"];
                                };
                                readonly data: {
                                    readonly type: "string";
                                    readonly description: "Hex-ed transaction data to sign before broadcasting to EVM network";
                                };
                                readonly value: {
                                    readonly type: "string";
                                    readonly description: "Transaction value to specifiy when broadcasting to EVM network";
                                };
                            };
                        };
                    };
                    readonly sellDetails: {
                        readonly type: "object";
                        readonly description: "Selling details for every to-sell items";
                        readonly required: readonly ["items"];
                        readonly properties: {
                            readonly items: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly required: readonly ["assetId", "orderId", "sellQuantity"];
                                    readonly properties: {
                                        readonly assetId: {
                                            readonly type: "string";
                                        };
                                        readonly orderId: {
                                            readonly type: "string";
                                            readonly description: "Which order (bid) is sold to for this asset";
                                        };
                                        readonly sellQuantity: {
                                            readonly type: "number";
                                            readonly minimum: 1;
                                            readonly description: "How many quantity is sold to this order for this asset";
                                        };
                                    };
                                };
                            };
                        };
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly enum: readonly ["success"];
                        readonly description: "`success`";
                    };
                };
            }];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const SearchCollections: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly chain: {
                readonly type: "string";
                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
            };
            readonly pattern: {
                readonly type: "string";
                readonly description: "Any name pattern you want to search for collections. Only first 50 collection matched will be returned";
            };
        };
        readonly required: readonly ["chain", "pattern"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly collections: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly chain: {
                                readonly type: "string";
                                readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                            };
                            readonly id: {
                                readonly type: "string";
                            };
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly symbol: {
                                readonly type: "string";
                                readonly description: "i.e. collection slug";
                            };
                            readonly description: {
                                readonly type: "string";
                            };
                            readonly media: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly url: {
                                        readonly type: "string";
                                    };
                                    readonly mimeType: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly social: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly twitterUsername: {
                                        readonly type: "string";
                                    };
                                    readonly discordUrl: {
                                        readonly type: "string";
                                    };
                                    readonly websiteUrl: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly verification: {
                                readonly type: "string";
                                readonly enum: readonly ["VERIFIED", "UNVERIFIED"];
                                readonly description: "`VERIFIED` `UNVERIFIED`";
                            };
                            readonly isTradeable: {
                                readonly type: "boolean";
                            };
                            readonly royalty: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly recipient: {
                                        readonly type: "string";
                                    };
                                    readonly bps: {
                                        readonly type: "number";
                                        readonly maximum: 10000;
                                        readonly minimum: 0;
                                    };
                                    readonly isOptional: {
                                        readonly type: "boolean";
                                    };
                                };
                                readonly required: readonly ["recipient", "bps", "isOptional"];
                            };
                            readonly collectionType: {
                                readonly type: "string";
                                readonly enum: readonly ["ERC721", "ERC1155"];
                                readonly description: "`ERC721` `ERC1155`";
                            };
                            readonly isSeaportV16Disabled: {
                                readonly type: "boolean";
                            };
                            readonly isSeaportV16RoyaltyOptional: {
                                readonly type: "boolean";
                            };
                            readonly seaportV16ListingCurrencies: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly address: {
                                            readonly type: "string";
                                        };
                                        readonly name: {
                                            readonly type: "string";
                                        };
                                        readonly symbol: {
                                            readonly type: "string";
                                        };
                                        readonly decimals: {
                                            readonly type: "number";
                                        };
                                    };
                                    readonly required: readonly ["address", "name", "symbol", "decimals"];
                                };
                            };
                            readonly chainData: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly contract: {
                                        readonly type: "string";
                                    };
                                    readonly transferability: {
                                        readonly type: "string";
                                        readonly enum: readonly ["TRANSFERABLE_TRADABLE", "TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_NOT_TRADABLE", "NOT_TRANSFERABLE_TRADABLE"];
                                        readonly description: "`TRANSFERABLE_TRADABLE` `TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_NOT_TRADABLE` `NOT_TRANSFERABLE_TRADABLE`";
                                    };
                                    readonly collectionBidSupported: {
                                        readonly type: "boolean";
                                    };
                                    readonly contractDeployedAt: {
                                        readonly type: "string";
                                    };
                                    readonly isMinting: {
                                        readonly type: "boolean";
                                    };
                                    readonly owner: {
                                        readonly type: "string";
                                    };
                                    readonly mintConfig: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly maxSupply: {
                                                readonly type: "string";
                                            };
                                            readonly totalSupply: {
                                                readonly type: "string";
                                            };
                                            readonly walletLimit: {
                                                readonly type: "string";
                                            };
                                            readonly baseURI: {
                                                readonly type: "string";
                                            };
                                            readonly contractURI: {
                                                readonly type: "string";
                                            };
                                            readonly stages: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly kind: {
                                                            readonly type: "string";
                                                            readonly enum: readonly ["public", "allowlist"];
                                                            readonly description: "`public` `allowlist`";
                                                        };
                                                        readonly price: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly currency: {
                                                                    readonly type: "object";
                                                                    readonly properties: {
                                                                        readonly chain: {
                                                                            readonly type: "string";
                                                                            readonly enum: readonly ["ethereum", "abstract", "apechain", "arbitrum", "base", "berachain", "bsc", "polygon", "sei", "avalanche", "monad"];
                                                                            readonly description: "`ethereum` `abstract` `apechain` `arbitrum` `base` `berachain` `bsc` `polygon` `sei` `avalanche` `monad`";
                                                                        };
                                                                        readonly assetId: {
                                                                            readonly type: "string";
                                                                        };
                                                                    };
                                                                    readonly required: readonly ["chain", "assetId"];
                                                                };
                                                                readonly raw: {
                                                                    readonly type: "string";
                                                                };
                                                            };
                                                            readonly required: readonly ["currency", "raw"];
                                                        };
                                                        readonly startTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly endTime: {
                                                            readonly type: "string";
                                                        };
                                                        readonly walletLimit: {
                                                            readonly type: "number";
                                                            readonly minimum: 0;
                                                            readonly maximum: 1000;
                                                        };
                                                        readonly maxSupply: {
                                                            readonly type: "number";
                                                            readonly minimum: 1;
                                                        };
                                                    };
                                                    readonly required: readonly ["kind", "price"];
                                                };
                                            };
                                            readonly payoutRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyRecipient: {
                                                readonly type: "string";
                                            };
                                            readonly royaltyBps: {
                                                readonly type: "string";
                                            };
                                            readonly mintFee: {
                                                readonly type: "string";
                                            };
                                        };
                                        readonly required: readonly ["maxSupply", "totalSupply", "walletLimit", "baseURI", "contractURI", "stages", "payoutRecipient", "royaltyRecipient", "royaltyBps"];
                                    };
                                };
                                readonly required: readonly ["contract", "transferability", "collectionBidSupported", "isMinting"];
                            };
                        };
                        readonly required: readonly ["chain", "id", "name", "verification", "isTradeable", "collectionType"];
                    };
                };
            };
            readonly required: readonly ["collections"];
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { GetAsks, GetAssets, GetBids, GetCollections, GetNftActivity, GetUserAssets, GetUserCollections, IxsBidGet, IxsBidPost, IxsBulkTransferGet, IxsBuyGet, IxsCancelOrderGet, IxsCancelOrderPost, IxsListGet, IxsListPost, IxsSellGet, SearchCollections };
