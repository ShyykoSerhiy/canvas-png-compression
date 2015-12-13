export class Base64Writer {
    bytesToBase64(type: string, buffer: Uint8Array) {
        var binary = '';
        for (var i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i])
        }
        return type + btoa(binary);
    };
}