let RecordRTC = require('recordrtc');

const Delta = Quill.import('delta');
const e = (tag, attrs, ...children) => {
    const elem = document.createElement(tag);
    Object.keys(attrs).forEach(key => elem[key] = attrs[key]);
    children.forEach(child => {
        if (typeof child === "string")
            child = document.createTextNode(child);
        elem.appendChild(child);
    });
    return elem;
};

const Embed = Quill.import('blots/embed');
var recorder; // globally accessible

class RTCBlot extends Embed {
    static create(stream) {
        let node = super.create();
        node.setAttribute('src', stream);
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
        return node.getAttribute('src');
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
        fn_checkDialogOpen(quill);
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
    document.getElementById('rtc-close-div').style.display = "none";
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

var recorder; // globally accessible

function fn_showRTCPalatte(quill) {
    let ele_rtc_area = document.createElement('div');
    let toolbar_container = document.querySelector('.ql-toolbar');
    let range = quill.getSelection();
    const atSignBounds = quill.getBounds(range.index);

    quill.container.appendChild(ele_rtc_area);
    let paletteMaxPos = atSignBounds.left + 318;//palette max width is 250
    ele_rtc_area.id = 'rtc-palette';
    ele_rtc_area.style.top = 10 + atSignBounds.top + atSignBounds.height + "px";
    if (paletteMaxPos > quill.container.offsetWidth) {
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
        { 'type': 'p', 'name': 'record', 'content': '<div class="i-record"><svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 25 25"><circle class="record-fill" cx="12.5" cy="12.5" r="8"/></svg></div>' },
        { 'type': 'n', 'name': 'stop', 'content': '<div class="i-stop"><svg xmlns="http://www.w3.org/2000/svg" width="25px" height="25px" viewBox="0 0 25 25"><path class="stop-fill" d="M6.25 6.25h12.5v12.5H6.25z"/></svg></div>' }
    ];

    let tabElementHolder = document.createElement('ul');
    tabToolbar.appendChild(tabElementHolder);

    if (document.getElementById('rtc-close-div') === null) {
        let closeDiv = document.createElement('div');
        closeDiv.id = 'rtc-close-div';
        closeDiv.addEventListener("click", fn_close, false);
        document.getElementsByTagName('body')[0].appendChild(closeDiv);
    }
    else {
        document.getElementById('rtc-close-div').style.display = "block";
    }

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
        if(rtcType.name == 'record'){
            rtcFilter.addEventListener('click', function(){
                this.disabled = true;
                let video = document.getElementById('rtc-video');

                setSrcObject(recorder.camera, video);
                video.play();
                recorder.startRecording();
                document.querySelector('.record-fill').style.fill = "red";              
            });
        }else{
            rtcFilter.addEventListener('click', function(){
                document.querySelector('.record-fill').style.fill = "#6F6D70"; 
                recorder.stopRecording(stopRecordingCallback.bind(this, quill));
            });
        }
    });
    fn_rtcPanelInit(panel, quill);
}

function fn_rtcPanelInit(panel, quill) {
    let videoElement = document.createElement('video');
    videoElement.id = 'rtc-video';
    videoElement.controls = true;
    videoElement.autoplay = true;
    panel.appendChild(videoElement);

    captureCamera(function(camera){
        recorder = RecordRTC(camera, {
            type: 'video'
        });

        recorder.camera = camera;

        setSrcObject(recorder.camera, videoElement);
        videoElement.play();
    })
    // document.querySelector('.filter-people').classList.add('active');
}

function captureCamera(callback) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function(camera) {
        callback(camera);
    }).catch(function(error) {
        alert('Unable to capture your camera. Please check console logs.');
        console.error(error);
    });
}

function stopRecordingCallback(quill) {
    var blob = recorder.getBlob();
    // let video = document.getElementById('rtc-video');
    // video.src = URL.createObjectURL(blob);
    // video.play();
    // document.querySelector('.filter-record').disabled = false;
    let range = quill.getSelection(true);
    quill.insertText(range.index, '\n', 'user');
    quill.insertEmbed(range.index + 1, 'rtc', URL.createObjectURL(blob))
    quill.formatText(range.index + 1, 1, { height: '240', width: '320'})
    quill.setSelection(range.index + 2, 'silent');
    fn_close();
}

function setSrcObject(stream, element, ignoreCreateObjectURL) {
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

Quill.register('modules/toolbar_rtc', ToolbarRTC);
export { ToolbarRTC as toolbarrtc };
