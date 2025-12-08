"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_ssr_shims_solana-system_ts";
exports.ids = ["_ssr_shims_solana-system_ts"];
exports.modules = {

/***/ "(ssr)/./shims/solana-system.ts":
/*!********************************!*\
  !*** ./shims/solana-system.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__),\n/* harmony export */   getTransferSolInstruction: () => (/* binding */ getTransferSolInstruction)\n/* harmony export */ });\n// Minimal browser shim for optional Solana system program import\n// Provides the named export expected by upstream libs.\n// If executed at runtime, it will throw to indicate unsupported usage.\nfunction getTransferSolInstruction(..._args) {\n    throw new Error('Solana transfer is not supported in this web build.');\n}\n// Keep a default export to satisfy any default import patterns.\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9zaGltcy9zb2xhbmEtc3lzdGVtLnRzIiwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsaUVBQWlFO0FBQ2pFLHVEQUF1RDtBQUN2RCx1RUFBdUU7QUFDaEUsU0FBU0EsMEJBQTBCLEdBQUdDLEtBQWdCO0lBQzVELE1BQU0sSUFBSUMsTUFBTTtBQUNqQjtBQUVBLGdFQUFnRTtBQUNoRSxpRUFBZSxDQUFDLENBQUMsRUFBQyIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxzZWJhc1xcRG9jdW1lbnRzXFxHaXQgUHJvamVjdHNcXGFwZXNvbmFwZS13ZWJcXHNoaW1zXFxzb2xhbmEtc3lzdGVtLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIE1pbmltYWwgYnJvd3NlciBzaGltIGZvciBvcHRpb25hbCBTb2xhbmEgc3lzdGVtIHByb2dyYW0gaW1wb3J0XHJcbi8vIFByb3ZpZGVzIHRoZSBuYW1lZCBleHBvcnQgZXhwZWN0ZWQgYnkgdXBzdHJlYW0gbGlicy5cclxuLy8gSWYgZXhlY3V0ZWQgYXQgcnVudGltZSwgaXQgd2lsbCB0aHJvdyB0byBpbmRpY2F0ZSB1bnN1cHBvcnRlZCB1c2FnZS5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFRyYW5zZmVyU29sSW5zdHJ1Y3Rpb24oLi4uX2FyZ3M6IHVua25vd25bXSk6IG5ldmVyIHtcclxuXHR0aHJvdyBuZXcgRXJyb3IoJ1NvbGFuYSB0cmFuc2ZlciBpcyBub3Qgc3VwcG9ydGVkIGluIHRoaXMgd2ViIGJ1aWxkLicpO1xyXG59XHJcblxyXG4vLyBLZWVwIGEgZGVmYXVsdCBleHBvcnQgdG8gc2F0aXNmeSBhbnkgZGVmYXVsdCBpbXBvcnQgcGF0dGVybnMuXHJcbmV4cG9ydCBkZWZhdWx0IHt9O1xyXG5cclxuXHJcbiJdLCJuYW1lcyI6WyJnZXRUcmFuc2ZlclNvbEluc3RydWN0aW9uIiwiX2FyZ3MiLCJFcnJvciJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./shims/solana-system.ts\n");

/***/ })

};
;