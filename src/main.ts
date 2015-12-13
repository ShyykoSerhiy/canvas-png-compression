import {PngWriter}  from './PngWriter';
import {Base64Writer} from './Base64Writer';

(() => {
    var toDataURLOld = HTMLCanvasElement.prototype.toDataURL;

    window.CanvasPngCompression = {
        Base64Writer: Base64Writer,
        PngWriter: PngWriter,
        replaceToDataURL: (options: PakoOptions) => {
            options = options || {};
            /**
             * Returns the content of the current canvas as an image that you can use as a source for another canvas or an HTML element.
             * @param type The standard MIME type for the image format to return. If you do not specify this parameter, the default value is a PNG format image.
             */
            HTMLCanvasElement.prototype.toDataURL = function(type?: string, encoderOptions?: number) {
                const me = this as HTMLCanvasElement;
                if (typeof type === 'undefined' || type === 'image/png') {
                    const ctx = me.getContext('2d');
                    if (typeof encoderOptions === 'undefined') {
                        encoderOptions = 1;
                    }
                    const level = Math.max(Math.min(Math.round(9 - (encoderOptions / (1 / 9))), 9), 0);

                    return new Base64Writer().bytesToBase64(
                        'data:image/png;base64,',
                        new PngWriter().write(ctx.getImageData(0, 0, me.width, me.height), Object.assign({}, options, { level: level }))
                    );
                }
                return toDataURLOld.apply(this, arguments);
            }
        },
        revertToDataURL: () => {
            HTMLCanvasElement.prototype.toDataURL = toDataURLOld;
            return;
        }
    }
})();