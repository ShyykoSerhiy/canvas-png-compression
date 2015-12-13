# canvas-png-compression
Shim for `HTMLCanvasElement.toDataURL()` to include compression for png image format.

This lib provides shim for `HTMLCanvasElement.toDataURL()` when image type is `'image/png'`. It adds ability to 
provide quality as second parameter to `HTMLCanvasElement.toDataURL()` function. Quality is a Number between 0 and 1 
indicating image quality if the requested type is `'image/jpeg'` or `'image/webp'`, for the image/png it indicate compression level.
Quality is normalized to compression level of zlib compression from 9 downto 0 (0 => 9, 1 => 0).  

# How it works 
Canvas-png-compression accesses to raw data of canvas using getImageData method of context. 
It then [pako](https://github.com/nodeca/pako) to apply zlib conversion to the filtered 
imageData(one of those filters is used for each row if image Sub, Up, Average, Paeth from 
[filters spec](ttp://www.w3.org/TR/PNG-Filters.html)). Compressed data is then packed with 
[other chunks](http://www.w3.org/TR/PNG-Chunks.html) into one Uint8Array buffer that represents
png image. It then is converted using window.btoa to base64 string;

#Usage
Install using bower
```sh
bower install canvas-png-compression
```
or npm
```sh
npm install canvas-png-compression
```

Then you'll need to include 
```html
<script src="components/canvas-png-compression/dist/bundle.js"></script>
```
or
```html
<script src="node_modules/canvas-png-compression/dist/bundle.js"></script>
```
 
Then you can use `CanvasPngCompression.replaceToDataURL();` to replace `HTMLCanvasElement.toDataURL()` with canvas-png-compression implementation.
```js
CanvasPngCompression.replaceToDataURL();
``` 

If for some reason you need to revert to native implementation, use:
```js
CanvasPngCompression.revertToDataURL();
``` 

### Passing params to pako 
You can pass params to pako's zlib deflate like this:
```js
CanvasPngCompression.replaceToDataURL({
    /**
        * The windowBits parameter is the base two logarithm of the window size (the size of the history buffer). It should be in the range 8..15 for this version of the library. Larger values of this parameter result in better compression at the expense of memory usage. The default value is 15 if deflateInit is used instead.
        windowBits can also be –8..–15 for raw deflate. In this case, -windowBits determines the window size. deflate() will then generate raw deflate data with no zlib header or trailer, and will not compute an adler32 check value.
        */
    windowBits: 15,
    /**
        * - chunk size used for deflating data chunks, this should be power of 2 and must not be less than 256 and more than 32*1024
        */
    chunkSize: 32 * 1024,
    /**
        * var Z_FILTERED            = 1;
        var Z_HUFFMAN_ONLY        = 2;
        var Z_RLE                 = 3;
        var Z_FIXED               = 4;
        var Z_DEFAULT_STRATEGY    = 0;
        The strategy parameter is used to tune the compression algorithm. Use the value Z_DEFAULT_STRATEGY for normal data, Z_FILTERED for data produced by a filter (or predictor), Z_HUFFMAN_ONLY to force Huffman encoding only (no string match), or Z_RLE to limit match distances to one (run-length encoding). Filtered data consists mostly of small values with a somewhat random distribution. In this case, the compression algorithm is tuned to compress them better. The effect of Z_FILTERED is to force more Huffman coding and less string matching; it is somewhat intermediate between Z_DEFAULT_STRATEGY and Z_HUFFMAN_ONLY. Z_RLE is designed to be almost as fast as Z_HUFFMAN_ONLY, but give better compression for PNG image data. The strategy parameter only affects the compression ratio but not the correctness of the compressed output even if it is not set appropriately. Z_FIXED prevents the use of dynamic Huffman codes, allowing for a simpler decoder for special applications.
        */
    strategy: 3
});
```

# Running demo
Run
```sh
node ./server.js
```
then open http://localhost:3000/demo/demo.html

# Acnowledgments 
I've got my inspiration from:
 * very well written [tiny-png-output-c](http://www.nayuki.io/page/tiny-png-output-c) by @nayuki
 * and [https://github.com/lukeapage/pngjs](https://github.com/lukeapage/pngjs) by @lukeapage

# Connected issues
https://code.google.com/p/chromium/issues/detail?id=179289

[MIT License](http://opensource.org/licenses/mit-license.php).