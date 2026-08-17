(function ($) {
	var halo = {
	    initSlidableSpotlight: function () {
            var slidableSpotlights = $('[data-slidable-spotlight]');

            if (slidableSpotlights.length) {
                slidableSpotlights.each(function () {
                    var self = $(this);
                    var cfg = window.haloConfig || {};
                    var bps = cfg.breakpoints || {};
                    var speed = (cfg.sliderDefaults && typeof cfg.sliderDefaults.speed !== 'undefined') ? cfg.sliderDefaults.speed : 500;
                    var autoplaySpeed = (cfg.sliderDefaults && typeof cfg.sliderDefaults.autoplaySpeed !== 'undefined') ? cfg.sliderDefaults.autoplaySpeed : 3000;
                    var bpLarge = (bps.xl && bps.xl <= 1400) ? bps.xl : 1366;
                    var bpSm = (typeof bps.sm !== 'undefined') ? bps.sm : 768;
                    
                    if (self.not('.slick-initialized')) {
                        self.slick({    
                            dots: false,
                            slidesToShow: 1, 
                            slidesToScroll: 1,
                            verticalSwiping: false,
                            fade: false,    
                            cssEase: "ease",
                            adaptiveHeight: true,
                            autoplay: false,
                            autoplaySpeed: autoplaySpeed,
                            arrows: true,   
                            nextArrow: window.arrows.icon_next,
                            prevArrow: window.arrows.icon_prev,
                            rtl: window.rtl_slick,
                            speed: speed,     
                            infinite: true, 
                            centerMode: true,   
                            centerPadding: '26%',
                            responsive: [{
                                breakpoint: bpLarge,
                                settings: {
                                    arrows: false,
                                    dots: true
                                }
                            },
                            {
                                breakpoint: bpSm,
                                settings: {
                                    arrows: false,
                                    dots: true,
                                    centerPadding: '30px'
                                }
                            }]
                        }); 
                    };
                });
            };
        }
	}
	halo.initSlidableSpotlight();
})(jQuery);
