(function ($) {
    var halo = {
        initSpotlightSlider: function() {
            var spotlightBlock = $('[data-spotlight-slider]');
            
            spotlightBlock.each(function() {
                var self = $(this),
                    dataRows = self.data('rows'),
                    dataRowsMb = self.data('rows-mb'),
                    dataArrows = self.data('arrows'),
                    dataArrowsMB = self.data('arrows-mb'),
                    dataDots = self.data('dots'),
                    dataDotsMB = self.data('dots-mb'),
                    dataSwipe = self.data('swipe');
                var cfg = window.haloConfig || {};
                var bps = cfg.breakpoints || {};
                var speed = (cfg.sliderDefaults && typeof cfg.sliderDefaults.speed !== 'undefined') ? cfg.sliderDefaults.speed : 1000;
                var bpLg = (typeof bps.lg !== 'undefined') ? bps.lg : 1024;
                var bpSm = (typeof bps.sm !== 'undefined') ? bps.sm : 768;
                    
                if ((dataSwipe == 'list' || dataSwipe == 'scroll') && window.innerWidth < bpSm) return;
                self.slick({
                    infinite: true,
                    speed: speed, 
                    arrows: dataArrows,
                    dots: dataDots,
                    nextArrow: window.arrows.icon_next,
                    prevArrow: window.arrows.icon_prev,
                    slidesToShow: dataRows,
                    slidesToScroll: 1,
                    rtl: window.rtl_slick,
                      responsive: [
                        {
                            breakpoint: bpLg,
                            settings: {
                                slidesToShow: 2,
                                arrows: dataArrowsMB,
                                dots: dataDotsMB
                            }
                        },
                        {
                            breakpoint: bpSm,
                            settings: {
                                slidesToShow: dataRowsMb,
                                arrows: dataArrowsMB,
                                dots: dataDotsMB
                            }
                        }                                          
                      ]
                });
            });
        }
    }
    halo.initSpotlightSlider();
})(jQuery);