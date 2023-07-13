/* DOKUWIKI:include_once assets/swipebox/js/jquery.swipebox.js */
/* DOKUWIKI:include_once assets/glightbox/js/glightbox.min.js */


(function() {
    function hasValidImg(link){
        // uncomment if only links with image thumbnails should be displayed in lightbox.
        // var img = link.querySelector('img');
        // if (!img) return false;    
        var href = link.getAttribute('href');
        if (!href) return false;
        href = href.toLowerCase();
        // its either _media or fetchphp
        if (href.startsWith(JSINFO.plugin_gallery.mediapaths[0])) return true;
        if (href.startsWith(JSINFO.plugin_gallery.mediapaths[1])) return true;
        return false;
    }
    function select_all_images() {
        var links = document.querySelectorAll('a[class=media][href]');
        // for loop to break if condition fails
        for (var i = 0; i < links.length; i++) {
            link = links[i];    
            if (!hasValidImg(link)) continue;
            // Add the lightbox
            link.classList.add('glightbox', 'glightbox-unassigned');
            // Dont show the image path as the title/description.
            link.setAttribute('data-glightbox', 'title:; description:;');
            // if its a caption.
            next = link.nextElementSibling;
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
            figlightbox[i] = GLightbox({
                selector: '.fglid_'+i,
                moreLength: 100,
                touchFollowAxis: false
            })
        });

        // Remaining stray images get own container
        document.querySelectorAll('a.glightbox-unassigned').forEach(function(img,i) {
            img.classList.add('glid_'+i);
            img.classList.remove('glightbox-unassigned');
            lightbox[i] = GLightbox({
                selector: '.glid_'+i,
                moreLength: 100,
                touchFollowAxis: false
            })
        });

        // Group all gallery images
        document.querySelectorAll('.glgallery[data-gallery]').forEach(function(gallery) {
            id = gallery.getAttribute('data-gallery');
            gallerybox[id] = GLightbox({
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

