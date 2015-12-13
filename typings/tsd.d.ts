/// <reference path="pako/pako.d.ts" />


declare module 'pako/lib/zlib/crc32' {
    interface crc32 {
        'default'(crc: number, buf: Uint8Array, len: number, pos: number): number;
    }
    var crc: crc32;

    export = crc;
}

declare module Pako {
    /**
     * Compress data with deflate algorithm and options.
     */
    export function deflate(data: Uint8Array | Array<number> | string, options?: any): Uint8Array | Array<number> | string;

    /**
     * The same as deflate, but creates raw data, without wrapper (header and adler32 crc).
     */
    export function deflateRaw(data: Uint8Array | Array<number> | string, options?: any): Uint8Array | Array<number> | string;
}

interface Window {
    CanvasPngCompression: {
        Base64Writer: any,
        PngWriter: any,
        replaceToDataURL: (options: PakoOptions) => void,
        revertToDataURL: () => void
    }
}

interface PakoOptions {
    level?: number,
    windowBits?: number,
    chunkSize?: number,
    strategy?: number
}
