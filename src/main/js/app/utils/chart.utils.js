define(["chromeUtils"], function(chromeUtils) {
    var toBase64 = function(img) {
        var canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 500;
        var ctx = canvas.getContext("2d");

        var base_img = new Image();
        var image = new Blob([img], {
            type: "image/png"
        });
        var src = window.URL.createObjectURL(image);

        base_img.onload = function() {
            console.log("inside f. ", base_img.getAttribute("src"));
            ctx.drawImage(base_img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            var base64Image = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
            return chromeUtils.addChart("acfb3bc012c", base64Image);
        };

        base_img.src = src;
        return;
    };

    var toPng = function(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for (var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {
            type: 'image/jpeg'
        });
    };

    return {
        "toBase64": toBase64,
        "toPng": toPng
    };
});
