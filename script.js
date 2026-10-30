/* DOKUWIKI:include_once assets/swipebox/js/jquery.swipebox.js */
/* DOKUWIKI:include_once assets/glightbox/js/glightbox.min.js */


(function() {
    function mediaSource(link) {
        var url = new URL(link.href, document.baseURI);
        return url.searchParams.get('media') || url.pathname;
    }

    function isPdfLink(link) {
        if (link.classList.contains('mf_pdf')) return true;
        return /\.pdf$/i.test(mediaSource(link));
    }

    function createLightbox(options) {
        var lightbox = GLightbox(options);
        lightbox.on('slide_before_load', function(slide) {
            if (slide.trigger && isPdfLink(slide.trigger)) {
                slide.slideNode.classList.add('gallery-pdf');
            }
        });
        return lightbox;
    }

    function hasPreviewableMedia(link){
        if (link.hasAttribute('download')) return false;
        var href = link.getAttribute('href');
        if (!href) return false;
        href = href.toLowerCase();
        // Only direct DokuWiki media links are eligible for the viewer.
        if (!href.startsWith(JSINFO.plugin_gallery.mediapaths[0]) &&
            !href.startsWith(JSINFO.plugin_gallery.mediapaths[1])) return false;
        // A download response never supplies an iframe document for GLightbox.
        // Keep CAD files, archives and other unsupported formats as normal links.
        return isPdfLink(link) || /\.(jpe?g|jpe|gif|png|apn|webp|avif|svg|mp4|ogg|webm|mov)$/i.test(mediaSource(link));
    }
    function select_all_images() {
        var links = document.querySelectorAll('.dw-content a.media[href]');
        // for loop to break if condition fails
        for (var i = 0; i < links.length; i++) {
            var link = links[i];
            if (!hasPreviewableMedia(link)) continue;
            // Add the lightbox
            link.classList.add('glightbox', 'glightbox-unassigned');
            // Dont show the image path as the title/description.
            link.setAttribute('data-glightbox', 'title:; description:;');
            if (isPdfLink(link)) {
                // Explicit type also prevents PDF #page= links becoming inline slides.
                link.setAttribute('data-type', 'external');
                link.setAttribute('data-width', 'calc(100vw - 16px)');
                link.setAttribute('data-height', 'calc(100vh - 64px)');
            }
            // if its a caption.
            var next = link.nextElementSibling;
            if (!next) continue;
            if (next.tagName === 'FIGCAPTION') {
                var figcap = 'glightbox-figcap-'+i;
                next.classList.add(figcap);
                link.setAttribute("data-glightbox", "title: ;description: "+"."+figcap);
            }
        }
    }
    function init_glightbox() {
        // Array for gallery 
        var gallerybox = [];
        // Array for figures
        var figlightbox = [];
        // Array containing stray images
        var lightbox = [];
        
        // Group all figure images
        document.querySelectorAll('.plugin_latexcaption_figure').forEach(function(figure, i) {
            figure.querySelectorAll('a.glightbox').forEach(function(img) {
                img.classList.add('fglid_'+i);
                img.classList.remove('glightbox-unassigned');
            });
            figlightbox[i] = createLightbox({
                selector: '.fglid_'+i,
                moreLength: 100,
                touchFollowAxis: false
            })
        });

        // Remaining stray images get own container
        document.querySelectorAll('a.glightbox-unassigned').forEach(function(img,i) {
            img.classList.add('glid_'+i);
            img.classList.remove('glightbox-unassigned');
            lightbox[i] = createLightbox({
                selector: '.glid_'+i,
                moreLength: 100,
                touchFollowAxis: false
            })
        });

        // Group all gallery images
        document.querySelectorAll('.glgallery[data-gallery]').forEach(function(gallery) {
            id = gallery.getAttribute('data-gallery');
            gallerybox[id] = createLightbox({
                selector: '.glightbox_'+id,
                moreLength: 100,
                touchFollowAxis: false
            });

            var main_img = gallery.querySelector('.glgallery-main-img img'),
                main_link = gallery.querySelector('.glgallery-main-img');

            // When mouse leave the row on desktop, revent main img back to active
            gallery.querySelectorAll('.glgallery-row').forEach(function(img_row) {
                img_row.addEventListener('mouseleave', function(e) {
                    gallery.querySelector('.glgallery-row-img-active').dispatchEvent(new Event('mouseover'));
                })
            });

            gallery.querySelectorAll('.glgallery-row-img').forEach(function(imgwrapper, idx){
                var link = imgwrapper.querySelector('a'),
                    href = link.getAttribute('href');
                    link.classList.remove('glightbox-unassigned');
                // mouseover event changes main image
                imgwrapper.addEventListener('mouseover', function(e) {
                    main_img.setAttribute('src', href);
                    main_link.onclick = function(e) { e.preventDefault(); link.click()};
                });
                // Only open lightbox on active item
                imgwrapper.addEventListener('click', function(e) {
                    // If first click, make active and prevent default click
                    if (!this.classList.contains('glgallery-row-img-active')) {
                        e.stopPropagation();
                        if (e.cancelable) e.preventDefault();
                        gallery.querySelector('.glgallery-row-img-active').classList.remove('glgallery-row-img-active');                 
                        this.className += ' glgallery-row-img-active';
                    }          
                },true);
                // Hover over first link to set main link
                if (idx === 0) imgwrapper.dispatchEvent(new Event('mouseover'));
            });
        });

    }
    
    var jsviewer = JSINFO && JSINFO.plugin_gallery && JSINFO.plugin_gallery.jsviewer;
    if (!jsviewer) return;
    if (JSINFO.plugin_gallery.jsviewer !== 'glightbox') return;
    if (JSINFO.plugin_gallery.jsviewerall) {
        select_all_images();
    }
    init_glightbox();
})();

jQuery(function () {

    /**
     * Add a quicklink to the media popup
     */
    function gallery_plugin() {
        var $opts = jQuery('#media__opts');
        if (!$opts.length) return;
        if (!window.opener) return;

        var glbl = document.createElement('label');
        var glnk = document.createElement('a');
        var gbrk = document.createElement('br');
        glnk.name = 'gallery_plugin';
        glnk.innerHTML = LANG.plugins.gallery.addgal; //FIXME localize
        glnk.style.cursor = 'pointer';

        glnk.onclick = function () {
            var $h1 = jQuery('#media__ns');
            if (!$h1.length) return;
            var ns = $h1[0].innerHTML;
            opener.insertAtCarret('wiki__text', '{{gallery>' + ns + '}}');
            if (!dw_mediamanager.keepopen) window.close();
        };

        $opts[0].appendChild(glbl);
        glbl.appendChild(glnk);
        $opts[0].appendChild(gbrk);
    }

    /**
     * Display a selected page and hide all others
     */
    function gallery_pageselect(e) {
        var galid = e.target.hash.substr(10, 4);
        var $pages = jQuery('div.gallery__' + galid);
        $pages.hide();
        jQuery('#' + e.target.hash.substr(1)).show();
        return false;
    }

    // === main ===

    // initialize the lightbox mechanism
    jQuery("a.lightbox, a[rel^='lightbox']").swipebox({
        loopAtEnd: true
    });

    gallery_plugin();

    // hide all pages except the first one
    var $pages = jQuery('div.gallery_page');
    $pages.hide();
    $pages.eq(0).show();

    // attach page selector
    jQuery('a.gallery_pgsel').click(gallery_pageselect);
});

