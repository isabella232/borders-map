/*
* Global vars
*/
var NAV_HEIGHT = 75;

var $w;
var $h;
var $slides;
var $components;
var $portraits;
var $play;
var $video;
var $primaryNav;
var $navButton;
var $nav;
var $navItems;
var $secondaryNav;
var $arrows;
var currentSection = '_'
var currentSectionIndex = 0;
var anchors;
var mobileSuffix;
var player;
var is_touch = Modernizr.touch;
var active_counter = null;
var begin = moment();
var aspectWidth = 16;
var aspectHeight = 9;
var optimalWidth;
var optimalHeight;
var w;
var h;
var $jplayer = null;

var resize = function() {

    $w = $(window).width();
    $h = $(window).height();

    $slides.width($w);

    optimalWidth = ($h * aspectWidth) / aspectHeight;
    optimalHeight = ($w * aspectHeight) / aspectWidth;

    w = $w;
    h = optimalHeight;

    if (optimalWidth > $w) {
        w = optimalWidth;
        h = $h;
    }
};

var setUpFullPage = function() {
    anchors = [];
    var anchor_count = 0;

   _.each($slides, function(section, index, list) {
        /*
        * Sets up the anchor list, used elsewhere for navigation and such.
        */
        var anchor = $(section).data('anchor');
        if (anchor === undefined) {
            return false;
        }
        anchors.push(anchor);

        /*
        * Numbers the stories according to their position.
        * Automates the appearance of the story numbers in the HTML.
        */
        var story_number = 'Story ' + anchor_count;
        $($(section).find('h4.story-number')[0]).html(story_number);
        $($('div.nav div.' + anchor + ' h4 em')[0]).html(story_number);
        anchor_count = anchor_count + 1;
    });

    $.fn.fullpage({
        autoScrolling: false,
        anchors: anchors,
        menu: '.nav',
        verticalCentered: false,
        fixedElements: '.primary-navigation, .nav',
        resize: false,
        css3: true,
        loopHorizontal: false,
        afterRender: onPageLoad,
        afterSlideLoad: lazyLoad,
        onSlideLeave: onSlideLeave
    });
};


var onPageLoad = function() {
    setSlidesForLazyLoading(0)
    $('body').css('opacity', 1);
};

// after a new slide loads

var lazyLoad = function(anchorLink, index, slideAnchor, slideIndex) {
    setSlidesForLazyLoading(slideIndex);

    if (slideAnchor == 'dashboard'){
        setTimeOnSite();
    }

    showNavigation();
};

var setSlidesForLazyLoading = function(slideIndex) {
    /*
    * Sets up a list of slides based on your position in the deck.
    * Lazy-loads images in future slides because of reasons.
    */
    var thisSlide = $slides[slideIndex];
    var nextSlide = $slides[slideIndex + 1]

    if ($(thisSlide).data('anchor')) {
        currentSection = $(thisSlide).data('anchor');
        for (i=0; i < anchors.length; i++) {
            if (anchors[i] === currentSection) {
                currentSectionIndex = i;
            }
        }
    };

    var slides = [
        $slides[slideIndex - 2],
        $slides[slideIndex - 1],
        thisSlide,
        nextSlide,
        $slides[slideIndex + 2]
    ];

    findImages(slides);

    if (!$jplayer && $(thisSlide).hasClass('video')) {
        setupVideoPlayer();
    }
}

var findImages = function(slides) {
    /*
    * Set background images on slides.
    * Should get square images for mobile.
    */

    // Mobile suffix should be blank by default.
    mobileSuffix = '';

    //
    if ($w < 769 && is_touch) {
        mobileSuffix = '-sq';
    }

    _.each($(slides), function(slide) {

        getBackgroundImage(slide);
        var containedImage = $(slide).find('.contained-image-container, .contained-image');
        getBackgroundImage(containedImage);
    });
};

var getBackgroundImage = function(container) {
    /*
    * Sets the background image on a div for our fancy slides.
    */

    if ($(container).data('bgimage')) {

        var image_filename = $(container).data('bgimage').split('.')[0];
        var image_extension = '.' + $(container).data('bgimage').split('.')[1];
        var image_path = 'assets/img/' + image_filename + mobileSuffix + image_extension;

        if ($(container).css('background-image') === 'none') {
            $(container).css('background-image', 'url(' + image_path + ')');
        }
        if ($(container).hasClass('contained-image-container')) {
            setImages($(container));
        }

     }
};

var showNavigation = function() {
    /*
    * Nav doesn't exist by default.
    * This function loads it up.
    */

    if ($slides.first().hasClass('active')) {
        /*
        * Title card gets no arrows and no nav.
        */
        $arrows.removeClass('active');
        $arrows.css({
            'opacity': 0,
            'display': 'none'
        });
        $primaryNav.css('opacity', '0');
    } else if ($slides.last().hasClass('active')) {
        /*
        * Last card gets no arrows but does have the nav.
        */
        $arrows.removeClass('active');
        $arrows.css({
            'opacity': 0,
            'display': 'none'
        });
        $primaryNav.css('opacity', '1');
    } else {
        /*
        * All of the other cards? Arrows and navs.
        */
        if (!$arrows.hasClass('active')) {
            animateArrows();
        }
        $primaryNav.css('opacity', '1');
    }
}

var animateArrows = function() {
    /*
    * Everything looks better faded. Hair; jeans; arrows.
    */
    $arrows.addClass('active');

    if ($arrows.hasClass('active')) {
        $arrows.css('display', 'block');
        var fade = _.debounce(fadeInArrows, 1);
        fade();
    }
};

var fadeInArrows = function() {
    /*
    * Debounce makes you do crazy things.
    */
    $arrows.css('opacity', 1)
};


var setImages = function(container) {
    /*
    * Image resizer from the Wolves lightbox + sets background image on a div.
    */

    // Grab Wes's properly sized width.
    var imageWidth = w;

    // Sometimes, this is wider than the window, shich is bad.
    if (imageWidth > $w) {
        imageWidth = $w;
    }

    // Set the hight as a proportion of the image width.
    var imageHeight = ((imageWidth * aspectHeight) / aspectWidth);

    // Sometimes the lightbox width is greater than the window height.
    // Center it vertically.
    if (imageWidth > $h) {
        imageTop = (imageHeight - $h) / 2;
    }

    // Sometimes the lightbox height is greater than the window height.
    // Resize the image to fit.
    if (imageHeight > $h) {
        imageWidth = ($h * aspectWidth) / aspectHeight;
        imageHeight = $h;
    }

    // Sometimes the lightbox width is greater than the window width.
    // Resize the image to fit.
    if (imageWidth > $w) {
        imageHeight = ($w * aspectHeight) / aspectWidth;
        imageWidth = $w;
    }

    // Set the top and left offsets. Image bottom includes offset for navigation
    var imageBottom = ($h - imageHeight) / 2 + 70;
    var imageLeft = ($w - imageWidth) / 2;

    // Set styles on the map images.
    $(container).css({
        'width': imageWidth + 'px',
        'height': imageHeight + 'px',
        'bottom': imageBottom + 'px',
        'left': imageLeft + 'px',
    });

};

var onSlideLeave = function(anchorLink, index, slideIndex, direction) {
    /*
    * Called when leaving a slide.
    */
    var thisSlide = $slides[slideIndex];

    if ($jplayer && $(thisSlide).hasClass('video')) {

        $(thisSlide).removeClass('video-playing');
        stopVideo();
    }
}

var goToNextSection = function() {
    $.fn.fullpage.moveTo(0, anchors[currentSectionIndex + 1]);
}

var goToNextSlide = function() {
    $.fn.fullpage.moveSlideRight();
}

var animateNav = function() {
    $nav.toggleClass('active');
    if ($nav.hasClass('active')) {
        $nav.css('display', 'block');
        var fade = _.debounce(fadeInNav, 1);
        fade();
    }
    else {
        $nav.css('opacity', 0);
        var fade = _.debounce(fadeOutNav, 500);
        fade();
    }
}

var fadeInNav = function() {
    /*
    * Separate function because you can't pass an argument to a debounced function.
    */
    $nav.css('opacity', 1);
};

var fadeOutNav = function() {
    /*
    * Separate function because you can't pass an argument to a debounced function.
    */
    $nav.css('display', 'none');
};

var setupVideoPlayer = function() {
    /*
    * Setup jPlayer.
    */
    var computePlayerHeight = function() {
        return ($h - ($('.jp-interface').height() + NAV_HEIGHT))
    }

    $jplayer = $('.jp-jplayer').jPlayer({
        ready: function () {
            $(this).jPlayer('setMedia', {
                poster: '../assets/img/junior/junior.jpg',
                m4v: 'http://pd.npr.org/npr-mp4/npr/nprvid/2014/03/20140328_nprvid_junior-n-600000.mp4',
                webmv: '../assets/img/junior/junior-final.webm'
            });
        },
        play: function (){
            if (!is_touch) {
                $('.jp-current-time').removeClass('hide');
                $('.jp-duration').addClass('hide');
            }
        },
        ended: function(){
            if (!is_touch) {
                $('.jp-current-time').addClass('hide');
                $('.jp-duration').removeClass('hide');
            }
        },
        size: {
            width: $w,
            height: computePlayerHeight() + 'px'
        },
        swfPath: 'js/lib',
        supplied: 'm4v, webmv',
        loop: false
    });

    $(window).resize(function() {
        $jplayer.jPlayer('option', { 'size': {
            width: $w,
            height: computePlayerHeight() + 'px'
        }});
    });
};

var startVideo = function() {
    if (!is_touch) {
        $(this).parents('.slide.video').addClass('video-playing');
    }
    $('.jp-jplayer').jPlayer('play');
}

var stopVideo = function() {
    $('.jp-jplayer').jPlayer('stop');
}

var setTimeOnSite = function(e) {
    /*
    * Differrence between now and when you loaded the page, formatted all nice.
    */
    var now = moment();
    var miliseconds = (now - begin);

    var minutes = Math.round(parseInt(miliseconds/1000/60));
    var seconds = Math.round(parseInt((miliseconds/1000) % 60));

    $('div.dashboard h3 span.minutes').html(minutes);
    $('div.dashboard h3 span.seconds').html(seconds);
}

var onUpdateCounts = function(e) {
    /*
    * Updates the count based on elapsed time and known rates.
    */
    var now = moment();
    var elapsed_seconds = (now - begin) / 1000;
    var RATES = [
        ['marijuana', 0.08844],
        ['cocaine', 0.01116],
        ['illegal-entry', 0.01065],
        ['vehicles', 2.15096],
        ['pedestrians', 1.30102]
    ]

    _.each(RATES, function(count, i){
        var count_category = count[0];
        var count_number = count[1];
        var count_unit = count[2];

        $('#' + count_category + ' span.number').html(Math.round(count_number * elapsed_seconds));
    });

};

var onResize = function(e) {
    if ($('.slide.active').hasClass('image-split')) {
        setImages($('.slide.active').find('.contained-image-container')[0]);
    }
}

$(document).ready(function() {
    $slides = $('.slide');
    $play_video = $('.btn-video');
    $video = $('.video');
    $components = $('.component');
    $portraits = $('.section[data-anchor="people"] .slide')
    $navButton = $('.primary-navigation-btn');
    $primaryNav = $('.primary-navigation');
    $nav = $('.nav');
    $navItems = $('.nav .section-tease');
    $secondaryNav = $('.secondary-nav-btn');
    $titleCardButton = $('.btn-play');
    $arrows = $('.controlArrow');

    setUpFullPage();
    resize();

    $play_video.on('click', startVideo);
    $navButton.on('click', animateNav);
    $navItems.on('click', animateNav);
    $secondaryNav.on('click', animateNav);
    $titleCardButton.on('click', goToNextSlide);

    active_counter = setInterval(onUpdateCounts,500);

    // Redraw slides if the window resizes
    $(window).resize(resize);
    $(window).resize(onResize);
});
