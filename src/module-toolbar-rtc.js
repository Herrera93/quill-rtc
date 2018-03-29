let RecordRTC = require('recordrtc');
let Quill = require('quill');

const Embed = Quill.import('blots/embed');
var recorder; // globally accessiblE

class RTCBlot extends Embed {
    static create(blob) {
        let node = super.create();

        if (typeof blob === 'string') {
            node.src = blob;
        } else {
            node.blob = blob;
            setSrcObject(blob, node);
        }
        node.setAttribute('controls', true);
        return node;
    }

    static formats(node) {
        // We still need to report unregistered embed formats
        const format = {};
        if (node.hasAttribute('height')) {
            format.height = node.getAttribute('height');
        }
        if (node.hasAttribute('width')) {
            format.width = node.getAttribute('width');
        }
        return format;
    }

    static value(node) {
        return node.blob;
    }

    format(name, value) {
        // Handle unregistered embed formats
        if (name === 'height' || name === 'width') {
            if (value) {
                this.domNode.setAttribute(name, value);
            } else {
                this.domNode.removeAttribute(name, value);
            }
        } else {
            super.format(name, value);
        }
    }
}

RTCBlot.blotName = 'rtc';
RTCBlot.tagName = 'video';

Quill.register({
    'formats/bolt': RTCBlot
});

class ToolbarRTC {
    constructor(quill) {
        this.quill = quill;
        this.toolbar = quill.getModule('toolbar');
        if (typeof this.toolbar != 'undefined')
            this.toolbar.addHandler('rtc', this.checkRecording);

        var rtcBtns = document.getElementsByClassName('ql-rtc');
        if (rtcBtns) {
            [].slice.call(rtcBtns).forEach(function (rtcBtn) {
                rtcBtn.innerHTML = '<svg viewbox="0 0 18 18"><rect class="ql-fill" x="0" y="3" rx="1" ry="1" height="12" width="12"></rect><path class="ql-fill" d="M 7,9 17,3 17,15 Z"></path><path class="ql-fill" d="M 17,3 C 17,3 18,3 18,4 L 18,14 C 18,14 18,15 17,15 Z"></path></svg>';
            });
        };
    }

    checkRecording() {
        let quill = this.quill;
        if (navigator.device && navigator.device.capture) {
            var options = {
                limit: 1,
                duration: 10
            };
            navigator.device.capture.captureVideo(onSuccess, onError, options);

            function onSuccess(mediaFiles) {
                var i, path, len;
                for (i = 0, len = mediaFiles.length; i < len; i += 1) {
                    path = mediaFiles[i].fullPath;
                    let range = quill.getSelection(true);
                    quill.insertText(range.index, '\n', 'user');
                    quill.insertEmbed(range.index + 1, 'rtc', path);
                    quill.formatText(range.index + 1, 1, { height: '240', width: '320' })
                    quill.setSelection(range.index + 2, 'silent');
                }
            }

            function onError(error) {
                navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
            }
        } else {
            fn_checkDialogOpen(quill);
        }
        this.quill.on('text-change', function (delta, oldDelta, source) {
            if (source == 'user') {
                fn_close();
                fn_updateRange(quill);
            }
        });
    }
}

function fn_close() {
    let ele_rtc_plate = document.getElementById('rtc-palette');
    if (ele_rtc_plate) { ele_rtc_plate.remove() };
}

function fn_checkDialogOpen(quill) {
    let elementExists = document.getElementById("rtc-palette");
    if (elementExists) {
        elementExists.remove();
    }
    else {
        fn_showRTCPalatte(quill);
    }
}

function fn_updateRange(quill) {
    let range = quill.getSelection();
    return range;
}

function fn_showRTCPalatte(quill) {
    let ele_rtc_area = document.createElement('div');
    let toolbar_container = document.querySelector('.ql-toolbar');
    let range = quill.getSelection();
    const atSignBounds = quill.getBounds(range.index);

    quill.container.appendChild(ele_rtc_area);
    let paletteMaxPos = atSignBounds.left + 318;//palette max width is 250
    ele_rtc_area.id = 'rtc-palette';
    ele_rtc_area.style.top = 10 + atSignBounds.top + atSignBounds.height + "px";
    if (window.innerWidth < 960) {
        ele_rtc_area.style.left = "0px";
    } else if (paletteMaxPos > quill.container.offsetWidth) {
        ele_rtc_area.style.left = (atSignBounds.left - 318) + "px";
    }
    else {
        ele_rtc_area.style.left = atSignBounds.left + "px";
    }


    let tabToolbar = document.createElement('div');
    tabToolbar.id = "tab-toolbar";
    ele_rtc_area.appendChild(tabToolbar);

    //panel
    let panel = document.createElement('div');
    panel.id = "tab-panel";
    ele_rtc_area.appendChild(panel);

    var rtcType = [
        { 'type': 'p', 'name': 'record', 'content': '<div class="toolbar-icon"><svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 25 25"><circle class="record-fill" cx="12.5" cy="12.5" r="8"/></svg></div>' },
        { 'type': 'n', 'name': 'stop', 'content': '<div class="toolbar-icon"><svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 25 25"><path class="stop-fill" d="M6.25 6.25h12.5v12.5H6.25z"/></svg></div>' },
        { 'type': 'o', 'name': 'close', 'content': '<div class="toolbar-icon"><svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 25 25"><path class="stop-fill" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></div>' }
    ];

    let tabElementHolder = document.createElement('ul');
    tabToolbar.appendChild(tabElementHolder);

    rtcType.map(function (rtcType) {
        //add tab bar
        let tabElement = document.createElement('li');
        tabElement.classList.add('rtc-tab');
        tabElement.classList.add('filter-' + rtcType.name);
        let tabValue = rtcType.content;
        tabElement.innerHTML = tabValue;
        tabElement.dataset.filter = rtcType.type;
        tabElementHolder.appendChild(tabElement);

        let rtcFilter = document.querySelector('.filter-' + rtcType.name);
        switch (rtcType.name) {
            case 'record':
                rtcFilter.addEventListener('click', function () {
                    let video = document.getElementById('rtc-video');
                    this.disabled = true;
                    document.querySelector('.record-fill').style.fill = "red";
                    setSrcObject(recorder.camera, video);
                    video.play();
                    recorder.startRecording();
                });
                break;
            case 'stop':
                rtcFilter.addEventListener('click', function () {
                    document.querySelector('.record-fill').style.fill = "#6F6D70";
                    recorder.stopRecording(stopRecordingCallback.bind(this, quill));
                });
                break;
            case 'close':
                rtcFilter.addEventListener('click', fn_close);
                break;
        }
    });
    fn_rtcPanelInit(panel, quill);
}

function captureSuccess(mediaFiles) {
    var i, path, len;
    for (i = 0, len = mediaFiles.length; i < len; i += 1) {
        path = mediaFiles[i].fullPath;

    }
};

// capture error callback
function captureError(error) {
    navigator.notification.alert('Error code: ' + error.code, null, 'Capture Error');
};

function fn_rtcPanelInit(panel, quill) {
    let videoElement = document.createElement('video');
    videoElement.id = 'rtc-video';
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.width = 318;
    videoElement.height = 220;
    panel.appendChild(videoElement);

    captureCamera(function (camera) {
        recorder = RecordRTC(camera, {
            type: 'video',
            mimeType: 'video/webm; codecs=opus,vp9'
        });

        recorder.camera = camera;

        setSrcObject(recorder.camera, videoElement);
        videoElement.play();
    })
    // document.querySelector('.filter-people').classList.add('active');
}

function captureCamera(callback) {
    var constraints = { audio: true, video: true };
    if (iosrtc) {
        constraints = {
            audio: true, video: {
                deviceId: 'com.apple.avfoundation.avcapturedevice.built-in_video:1',
                width: {
                    min: 320,
                    max: 640
                },
                frameRate: {
                    min: 1.0,
                    max: 60.0
                }
            }
        };
    }
    navigator.mediaDevices.getUserMedia(constraints).then(function (camera) {
        callback(camera);
    }).catch(function (error) {
        alert('Unable to capture your camera. Please check console logs.');
        console.error(error);
    });
}

function stopRecordingCallback(quill) {
    var blob = recorder.getBlob();
    console.log(blob);
    // let video = document.getElementById('rtc-video');
    // video.src = URL.createObjectURL(blob);
    // video.play();
    // document.querySelector('.filter-record').disabled = false;
    let range = quill.getSelection(true);
    quill.insertText(range.index, '\n', 'user');
    quill.insertEmbed(range.index + 1, 'rtc', blob);
    quill.formatText(range.index + 1, 1, { height: '240', width: '320' })
    quill.setSelection(range.index + 2, 'silent');
    fn_close();
}

function setSrcObject(stream, element, ignoreCreateObjectURL) {
    console.log("SET SRC OBJECT");
    if ('createObjectURL' in URL && !ignoreCreateObjectURL) {
        try {
            element.src = URL.createObjectURL(stream);
        } catch (e) {
            setSrcObject(stream, element, true);
            return;
        }
    } else if ('srcObject' in element) {
        element.srcObject = stream;
    } else if ('mozSrcObject' in element) {
        element.mozSrcObject = stream;
    } else {
        alert('createObjectURL/srcObject both are not supported.');
    }
}

export { ToolbarRTC, RTCBlot };
