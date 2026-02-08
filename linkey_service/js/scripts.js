let menuBtn = document.getElementById('menu-btn');
let menu = document.getElementById('menu');
let bg = document.getElementById('bg');
/**
 * メニューボタンの開閉
 * #menu-btn    メニューボタン
 * #gnav        ナビゲーションメニュー
 * #bg        ナビゲーションメニューとコンテンツの間に敷く背景
 */
function toggleMenu() {
  let expanded = (menuBtn.getAttribute('aria-expanded') === 'true');
  menuBtn.setAttribute('aria-expanded', !expanded);
  menu.inert = expanded;
  menu.classList.toggle('menu--open');
  if (bg) {
    bg.classList.toggle('bg--open');
  }

  // ▼ 追加：ハンバーガー開閉に応じてミニヘッダーを非表示/表示
  let miniNav = document.querySelector('.header__nav--mini');
  if(miniNav){
    miniNav.style.display = menu.classList.contains('menu--open') ? 'none' : '';

  }
}

// メニューボタンのクリックイベント
menuBtn.addEventListener('click', toggleMenu);

// 背景のクリックイベント
if (bg) {
  bg.addEventListener('click', toggleMenu);
}

/**
 * 画像などコンテンツ全体が読み込まれたタイミングで実行される
 */
$(window).on('load', function() {
  // ローディング要素をフェードアウト
  $('.loader').fadeOut();

  /* =========================================
   ▼ 追加：PC用グロナビ 子メニュー hover 開閉
   ここから
========================================= */
document.addEventListener('DOMContentLoaded', function () {
    // ミニヘッダーがある場合のみ実行
    let miniNav = document.querySelector('.header__nav--mini');
    if (!miniNav) return;

    const gnavItems = miniNav.querySelectorAll('.gnav-list__item');

    gnavItems.forEach(item => {
      const child = item.querySelector('.gnav-list__child');
      if (!child) return; // 子メニューなしはスキップ

      // ▼ 追加：hoverで子メニューを表示
      item.addEventListener('mouseenter', () => {
        child.style.visibility = 'visible';
        child.style.opacity = '1';
        child.style.pointerEvents = 'auto';
      });

      // ▼ 追加：hover外で子メニューを非表示
      item.addEventListener('mouseleave', () => {
        child.style.visibility = 'hidden';
        child.style.opacity = '0';
        child.style.pointerEvents = 'none';
      });
    });
  });
/* =========================================
   ▲ ここまで追加
========================================= */
});


/**
 * HTML(DOM)が読み込まれたタイミングで実行される
 */
(function() {
  // $('.trigger').on('click', function () {
  //   $(this).toggleClass('trigger--open');
  // });
  /**
   * ページ内リンクボタン自動生成
   */
  var $goto_tareget = $('.post-type-page,.post-type-information,.post-type-blog');
  if ($goto_tareget.length && $goto_tareget.find('.goto').length && $goto_tareget.find('.h1,.h2,.h3').length) {
    $goto_tareget.find('.h1[id],.h2[id],.h3[id]').each(function (number, element) {
      $goto_tareget.find('.goto').append('<div class="goto__item"><a class="goto__link jumper" href="#' + $(element).attr('id') + '">' + $(element).text() + '</a></div>');
    });
  }

  $('.open-box__title').on('click', function() {
    $(this).next('.open-box__text').slideToggle();
    $(this).toggleClass("open-box__title--open");
  })

  /**
   * フォトスライダー
   * slick.min.js が必須
   * https://github.com/kenwheeler/slick/
   */
  $('.photoslider').each(function () {
    // メインスライダーのクラス名
    $main = $(this).find('.photoslider-main');
    // ナビゲーションのクラス名
    $nav = $(this).find('.photoslider-nav');
    $main.slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      prevArrow: '<button type="button" class="slick-prev"></button>',
      nextArrow: '<button type="button" class="slick-next"></button>',
      fade: true,
      asNavFor: $nav
    });
    $nav.slick({
      // ナビゲーションを何個表示するか
      slidesToShow: 4,
      slidesToScroll: 1,
      asNavFor: $main,
      centerMode: false,
      dots: false,
      focusOnSelect: true,
      arrows: false,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 4
          }
              }
            ]
    });
  });

  /**
   * スクロールされたときにコンテンツを表示する
   * jquery.inview.min.js が必須
   * https://github.com/protonet/jquery.inview
   * 要素に data-delay を設定することで表示の遅延ができる
   * 例：<div class="lazy" data-delay="500">
   */
  $('.lazy').on('inview', function (event, isInView) {
    if (isInView) {
      $(this).delay($(this).data('delay')).queue(function () {
        $(this).addClass('lazy--inview');
      });
    }
  });

  /*
   * Magnific Popup
   */
  $('.gallery').each(function() {
    $(this).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled: true,
      },
    });
  });
  $('.lightbox').magnificPopup({
    type: 'image',
  });
  $('.popup-youtube').magnificPopup({
    disableOn: 700,
    type: 'iframe',
    mainClass: 'mfp-fade',
    removalDelay: 160,
    preloader: false,
    fixedContentPos: false
  });
})();







/**
 * Splide
 */


/*
背景のフェード自動スクロールスライダーここから ↓
 */
var fadeBg = document.getElementById('fade-bg');
if( fadeBg !== null ){
let fadeBg = new Splide( '#fade-bg', {
  type: 'fade',
  pagination: false,
  arrows: false,
  autoplay: true,
  rewind: true,
  drag:false,
  rewindByDrag:false,
  pauseOnHover:false,
  interval: 3000,
  speed: 3000,
} );
fadeBg.mount();
};
/*
背景のフェード自動スクロールスライダーここまで ↑
 */





/*
流れる自動スライダーここから ↓
 */
var autoScrollslider = document.getElementById('auto-scroll');
if( autoScrollslider !== null ){
let autoScrollslider = new Splide( '#auto-scroll', {
  type: 'loop',
  pagination: false,
  fixedWidth: '180px',
  gap: 10,
  arrows: false,
  perPage: 3,
  autoScroll: {
    speed: .5,   // 逆方向にしたいならマイナス値を指定
    pauseOnHover: false,
  },
  mediaQuery: 'min',
  // ↑スマホ時の指定
  breakpoints: {
    768: { //768px以上の指定
      fixedWidth: '358px',
      gap: 20,
    },
  }
} );
autoScrollslider.mount(window.splide.Extensions);
};
/*
流れる自動スライダーここまで ↑
 */




/*
サムネイル無しスライダーここから ↓
 */
var simpleCarousel = document.getElementById('simple-carousel');
if( simpleCarousel !== null ){
  let simpleCarousel = new Splide( '#simple-carousel', {
    autoplay: false, // 自動再生
    type: "loop", // ループ
    pauseOnHover: false, // カーソルが乗ってもスクロールを停止させない
    pauseOnFocus: false, // 矢印をクリックしてもスクロールを停止させない
    interval: 3000, // 自動再生の間隔
    speed: 1000, // スライダーの移動時間
  } );
  simpleCarousel.mount();
};
/*
サムネイル無しスライダーここまで ↑
 */



/*
サムネイル付きスライダーここから ↓
 */
var thumbnailSlider = document.getElementById('main-carousel');
if( thumbnailSlider !== null ){
  // メインスライダー
  let main_carousel = new Splide( '#main-carousel', {
    type: 'loop',
    // autoWidth: true,
    perPage: 3,
    padding: '5rem',
    pagination: false,
    arrows: true,
  } );
  // サムネイルスライダー
  let thumbnail_carousel = new Splide( '#thumbnail-carousel', {
    fixedWidth: 100,
    gap: 10,
    rewind: true,
    pagination: false,
    isNavigation: true,
  } );
  // スライダーの同期
  main_carousel.sync( thumbnail_carousel );
  main_carousel.mount();
  thumbnail_carousel.mount();
};
/*
サムネイル付きスライダーここまで ↑
 */


/*
カードのスライダーここから ↓
 */
var cardSlider = document.getElementById('card-slider');
if( cardSlider !== null ){
  let cardSlider = new Splide( '#card-slider', {
    type: 'slide',
    perPage: 1,
    gap: 16,
    padding: { right: 15 },
    rewind: true,
    pagination: true,
    arrows: false,
    mediaQuery: 'min',
    drag: 'free',
    destroy: false, // スライダーを破棄
    // ↑スマホ時の指定
    breakpoints: {
      768: {
        gap: 20,
        drag: 'free',
        perPage: 1,
        padding: { right: 100 },
      },
      1024: { //1024px以上の指定
        destroy: true, // 1024px未満でスライダー開始
      },
    }
  } );
  cardSlider.mount();
};
/*
カードのスライダーここまで ↑
 */










