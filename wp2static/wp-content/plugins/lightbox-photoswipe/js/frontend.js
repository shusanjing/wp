var lbwpsInit = function(domUpdate) {
    var PhotoSwipe = window.PhotoSwipe,
        PhotoSwipeUI_Default = window.PhotoSwipeUI_Default;

    var links = document.querySelectorAll('a[data-lbwps-width]');

    var originalBodyPaddingRight = '';
    var originalBodyOverflow = '';

    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('data-lbwps-handler') != '1') {
            links[i].setAttribute('data-lbwps-handler', '1');
            links[i].addEventListener('click', function (event) {
                if (!PhotoSwipe || !PhotoSwipeUI_Default) {
                    return;
                }
                event.preventDefault();
                openPhotoSwipe(false, 0, this, false, '');
            });
        }
    }

    var hideScrollbar =  function() {
        const scrollbarWidth = window.innerWidth - document.body.offsetWidth;
        originalBodyPaddingRight = document.body.style.paddingRight;
        originalBodyOverflow = document.body.style.overflow;
        document.body.style.paddingRight = scrollbarWidth + 'px';
        document.body.style.overflow = 'hidden';
    }

    var showScrollbar = function() {
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.body.style.overflow = originalBodyOverflow;
    }

    var parseThumbnailElements = function(link, id) {
        var elements,
            galleryItems = [],
            index;

        if (id == null || id == 1) {
            elements = document.querySelectorAll('a[data-lbwps-width]:not([data-lbwps-gid])');
        } else {
            elements = document.querySelectorAll('a[data-lbwps-width][data-lbwps-gid="'+id+'"]');
        }

        for (var i=0; i<elements.length; i++) {
            var element = elements[i];

            // Only use image if it was not added already
            var useImage = true;
            var linkHref = element.getAttribute('href');
            for (var j=0; j<galleryItems.length; j++) {
                if (galleryItems[j].src == linkHref) {
                    useImage = false;
                }
            }

            if (useImage) {
                var caption = null;
                var tabindex = element.getAttribute('tabindex');

                if (tabindex == null) {
                    tabindex = 0;
                }

                caption = element.getAttribute('data-lbwps-caption');

                // Use attributes "data-caption-title" and "data-caption-desc" in the <a> element if available
                if (caption == null) {
                    if (element.getAttribute('data-caption-title') != null) {
                        caption = '<div class="pswp__caption__title">' + element.getAttribute('data-caption-title') + '</div>';
                    }

                    if (element.getAttribute('data-caption-desc') != null) {
                        if (caption == null) caption = '';
                        caption = caption + '<div class="pswp__caption__desc">' + element.getAttribute('data-caption-desc') + '</div>';
                    }
                }

                // Attribute "aria-describedby" in the <a> element contains the ID of another element with the caption
                if (caption == null && element.firstElementChild) {
                    var describedby = element.firstElementChild.getAttribute('aria-describedby');
                    if (describedby != null) {
                        var description = document.getElementById(describedby);
                        if (description != null) caption = description.innerHTML;
                    }
                }

                // Other variations
                if (caption == null) {
                    var nextElement = element.nextElementSibling;
                    var parentElement = element.parentElement.nextElementSibling;
                    var parentElement2 = element.parentElement.parentElement.nextElementSibling;
                    var parentElement3 = element.parentElement.parentElement.parentElement.nextElementSibling;

                    if (nextElement != null) {
                        if (nextElement.className === '.wp-caption-text') {
                            caption = nextElement.innerHTML;
                        } else if (nextElement && nextElement.nodeName === "FIGCAPTION") {
                            caption = nextElement.innerHTML;
                        }
                    } else if (parentElement != null) {
                        if (parentElement.className === '.wp-caption-text') {
                            caption = parentElement.innerHTML;
                        } else if (parentElement.className === '.gallery-caption') {
                            caption = parentElement.innerHTML;
                        } else if (parentElement.nextElementSibling && parentElement.nextElementSibling.nodeName === "FIGCAPTION") {
                            caption = parentElement.nextElementSibling.innerHTML;
                        }
                    } else if (parentElement2 && parentElement2.nodeName === "FIGCAPTION") {
                        caption = parentElement2.innerHTML;
                    } else if (parentElement3 && parentElement3.nodeName === "FIGCAPTION") {
                        // This variant is used by Gutenberg gallery blocks
                        caption = parentElement3.innerHTML;
                    }
                }

                if (caption == null) {
                    caption = element.getAttribute('title');
                }

                if (caption == null && lbwpsOptions.use_alt == '1' && element.firstElementChild) {
                    caption = element.firstElementChild.getAttribute('alt');
                }

                if (element.getAttribute('data-lbwps-description') != null) {
                    if (caption == null) caption = '';
                    caption = caption + '<div class="pswp__description">' + element.getAttribute('data-lbwps-description') + '</div>';
                }

                galleryItems.push({
                    src: element.getAttribute('href'),
                    msrc: element.getAttribute('href'),
                    w: element.getAttribute('data-lbwps-width'),
                    h: element.getAttribute('data-lbwps-height'),
                    title: caption,
                    exif: element.getAttribute('data-lbwps-exif'),
                    getThumbBoundsFn: false,
                    showHideOpacity: true,
                    el: element,
                    tabindex: tabindex
                });
            }
        }

        // Sort items by tabindex
        galleryItems.sort(function(a, b) {
            var indexa = parseInt(a.tabindex);
            var indexb = parseInt(b.tabindex);
            if(indexa > indexb) {
                return 1;
            }
            if(indexa < indexb) {
                return -1;
            }
            return 0;
        });

        // Determine current selected item
        for (var i=0; i<galleryItems.length; i++) {
            if(galleryItems[i].el == link) {
                index = i;
            }
        }

        return [galleryItems, parseInt(index, 10)];
    };

    var photoswipeParseHash = function() {
        var hash = window.location.hash.substring(1), params = {};

        if(hash.length < 5) {
            return params;
        }

        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if(!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if(pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }

        if(params.gid) {
            params.gid = parseInt(params.gid, 10);
        }

        return params;
    };

    var openPhotoSwipe = function(element_index, group_index, element, fromURL, returnToUrl) {
        var id = 1,
            pswpElement = document.querySelector('.pswp'),
            gallery,
            options,
            items,
            index;

        if (element != null) {
            id = element.getAttribute('data-lbwps-gid');
        } else {
            id = group_index;
        }

        items = parseThumbnailElements(element, id);
        if(element_index == false) {
            index = items[1];
        } else {
            index = element_index;
        }
        items = items[0];

        options = {
            index: index,
            getThumbBoundsFn: false,
            showHideOpacity: true,
            loop: true,
            tapToToggleControls: true,
            clickToCloseNonZoomable: false,
        };

        if (id != null) {
            options.galleryUID = id;
        }

        if(lbwpsOptions.close_on_click == '0') {
            options.closeElClasses = ['pspw__button--close'];
        }

        if(lbwpsOptions.share_facebook == '1' ||
            lbwpsOptions.share_twitter == '1' ||
            lbwpsOptions.share_pinterest == '1' ||
            lbwpsOptions.share_download == '1' ||
            lbwpsOptions.share_copyurl == '1' ||
            (lbwpsOptions.share_custom_link !== '' && lbwpsOptions.share_custom_label !== '')) {
            options.shareEl = true;
            options.shareButtons = [];
            if(lbwpsOptions.share_facebook == '1') {
                if(lbwpsOptions.share_direct == '1') {
                    url = 'https://www.facebook.com/sharer/sharer.php?u={{image_url}}';
                } else {
                    url = 'https://www.facebook.com/sharer/sharer.php?u={{url}}';
                }
                options.shareButtons.push({id:'facebook', label:lbwpsOptions.label_facebook, url:url});
            }
            if(lbwpsOptions.share_twitter == '1') {
                if(lbwpsOptions.share_direct == '1') {
                    url = 'https://twitter.com/intent/tweet?text={{text}}&url={{image_url}}';
                } else {
                    url = 'https://twitter.com/intent/tweet?text={{text}}&url={{url}}';
                }
                options.shareButtons.push({id:'twitter', label:lbwpsOptions.label_twitter, url:url});
            }
            if(lbwpsOptions.share_pinterest == '1') options.shareButtons.push({id:'pinterest', label:lbwpsOptions.label_pinterest, url:'http://www.pinterest.com/pin/create/button/?url={{url}}&media={{image_url}}&description={{text}}'});
            if(lbwpsOptions.share_download == '1') options.shareButtons.push({id:'download', label:lbwpsOptions.label_download, url:'{{raw_image_url}}', download:true});
            if(lbwpsOptions.share_copyurl == '1') options.shareButtons.push({id:'copyurl', label:lbwpsOptions.label_copyurl, url:'{{raw_image_url}}', onclick:'window.lbwpsCopyToClipboard(\'{{raw_image_url}}\');return false;', download:false});
            if(lbwpsOptions.share_custom_link !== '' && lbwpsOptions.share_custom_label !== '') {
                options.shareButtons.push({id:'custom', label:lbwpsOptions.share_custom_label, url:lbwpsOptions.share_custom_link, download:false});
            }
        } else {
            options.shareEl = false;
        }

        if(lbwpsOptions.wheelmode == 'close') options.closeOnScroll = true;else options.closeOnScroll = false;
        if(lbwpsOptions.wheelmode == 'zoom') options.zoomOnScroll = true;else options.zoomOnScroll = false;
        if(lbwpsOptions.wheelmode == 'switch') options.switchOnScroll = true;else options.switchOnScroll = false;
        if(lbwpsOptions.close_on_drag == '1') options.closeOnVerticalDrag = true;else options.closeOnVerticalDrag = false;
        if(lbwpsOptions.history == '1') options.history = true;else options.history = false;
        if(lbwpsOptions.show_counter == '1') options.counterEl = true;else options.counterEl = false;
        if(lbwpsOptions.show_fullscreen == '1') options.fullscreenEl = true;else options.fullscreenEl = false;
        if(lbwpsOptions.show_zoom == '1') options.zoomEl = true;else options.zoomEl = false;
        if(lbwpsOptions.show_caption == '1') options.captionEl = true;else options.captionEl = false;
        if(lbwpsOptions.loop == '1') options.loop = true;else options.loop = false;
        if(lbwpsOptions.pinchtoclose == '1') options.pinchToClose = true;else options.pinchToClose = false;
        if(lbwpsOptions.taptotoggle == '1') options.tapToToggleControls = true; else options.tapToToggleControls = false;
        if(lbwpsOptions.desktop_slider == '1') options.desktopSlider = true; else options.desktopSlider = false;
        options.spacing = lbwpsOptions.spacing/100;

        options.timeToIdle = lbwpsOptions.idletime;

        if(fromURL == true) {
            options.index = parseInt(index, 10) - 1;
        }

        if(lbwpsOptions.fulldesktop == '1') {
            options.barsSize = {top: 0, bottom: 0};
        }

        gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.listen('gettingData', function (index, item) {
            if (item.w < 1 || item.h < 1) {
                var img = new Image();
                img.onload = function () {
                    item.w = this.width;
                    item.h = this.height;
                    gallery.updateSize(true);
                };
                img.src = item.src;
            }
        });

        if (returnToUrl != '') {
            gallery.listen('unbindEvents', function() {
                document.location.href = returnToUrl;
            });
        }

        gallery.listen('destroy', function() {
            showScrollbar();
            window.lbwpsPhotoSwipe = null;
        })

        window.lbwpsPhotoSwipe = gallery;
        hideScrollbar();
        gallery.init();
    };

    window.lbwpsCopyToClipboard = function(str) {
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        const selected =
            document.getSelection().rangeCount > 0
                ? document.getSelection().getRangeAt(0)
                : false;
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        if (selected) {
            document.getSelection().removeAllRanges();
            document.getSelection().addRange(selected);
        }
    };

    if(true !== domUpdate) {
        var hashData = photoswipeParseHash();
        if (hashData.pid && hashData.gid) {
            var returnUrl = '';
            if (typeof (hashData.returnurl) !== 'undefined') {
                returnUrl = hashData.returnurl;
            }
            openPhotoSwipe(hashData.pid, hashData.gid, null, true, returnUrl);
        }
    }
};

// Universal ready handler
var lbwpsReady = (function () {
    var readyEventFired = false;
    var readyEventListener = function (fn) {

        // Create an idempotent version of the 'fn' function
        var idempotentFn = function () {
            if (readyEventFired) {
                return;
            }
            readyEventFired = true;
            return fn();
        }

        // The DOM ready check for Internet Explorer
        var doScrollCheck = function () {
            if (readyEventFired) {
                return;
            }

            // If IE is used, use the trick by Diego Perini
            // http://javascript.nwbox.com/IEContentLoaded/
            try {
                document.documentElement.doScroll('left');
            } catch(e) {
                setTimeout(doScrollCheck, 1);
                return;
            }

            // Execute any waiting functions
            return idempotentFn();
        }

        // If the browser ready event has already occured
        if (document.readyState === "complete") {
            return idempotentFn()
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        if (document.addEventListener) {

            // Use the handy event callback
            document.addEventListener("DOMContentLoaded", idempotentFn, false);

            // A fallback to window.onload, that will always work
            window.addEventListener("load", idempotentFn, false);

            // If IE event model is used
        } else if (document.attachEvent) {

            // ensure firing before onload; maybe late but safe also for iframes
            document.attachEvent("onreadystatechange", idempotentFn);

            // A fallback to window.onload, that will always work
            window.attachEvent("onload", idempotentFn);

            // If IE and not a frame: continually check to see if the document is ready
            var toplevel = false;

            try {
                toplevel = window.frameElement == null;
            } catch (e) {}

            if (document.documentElement.doScroll && toplevel) {
                return doScrollCheck();
            }
        }
    };
    return readyEventListener;
})();

lbwpsReady(function() {
    window.lbwpsPhotoSwipe = null;
    lbwpsInit(false);

    var mutationObserver = null;
    if (typeof MutationObserver !== 'undefined') {
        var mutationObserver = new MutationObserver(function (mutations) {
            if (window.lbwpsPhotoSwipe === null) {
                var nodesAdded = false;
                for (var i = 0; i < mutations.length; i++) {
                    if ('childList' === mutations[i].type) {
                        nodesAdded = true;
                    }
                };
                if (nodesAdded) {
                    lbwpsInit(true);
                }
            }
        });
        mutationObserver.observe(document.querySelector('body'), {childList: true, subtree: true, attributes: false});
    }
});
