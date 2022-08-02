new Splide( '#reviews_slider', {
    perPage: 2,
    perMove: 2,
    type: 'loop',

    breakpoints: {
      1025: {
              fixedHeight: '442px',
      },

      769: {
          perPage: 1,
          fixedWidth: 'calc(100% - 0px)',
          fixedHeight: '340px',
      },
    }
} ).mount();