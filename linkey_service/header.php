<!doctype html>
<html <?php language_attributes(); ?>>

<head>
  <!-- Google Tag Manager -->
  <script>(function (w, d, s, l, i) {
          w[l] = w[l] || []; w[l].push({
              'gtm.start':
                  new Date().getTime(), event: 'gtm.js'
          }); var f = d.getElementsByTagName(s)[0],
              j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : ''; j.async = true; j.src =
                  'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', 'GTM-PCQZ8JT');</script>

  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="profile" href="https://gmpg.org/xfn/11">

  <?php wp_head(); ?>

</head>


<body <?php body_class(); ?>>
    <!-- Google Tag Manager (noscript) -->
    <noscript>
        <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PCQZ8JT" height="0" width="0" style="display:none;visibility:hidden"></iframe>
    </noscript>
  <div class="loader">
    <div class="loader__icon"></div>
  </div>

  <div class="page" id="top">
    <header class="page__header header" id="header">
      <div class="header__body">
        <a href="<?php echo home_url(); ?>" class="logo">
            <?php
              get_template_part(
                'template-parts/image',
                null,
                array(
                  'src' => 'images/logo.png',
                  'class' => 'logo__img',
                  'alt' => 'ロゴ',
                  // ファーストビューの要素は遅延読み込みしない
                  'loading' => 'eager',
                )
              );
              ?></a>

        <!-- ▼ 追加：PC用グロナビ -->
        <nav class="header__nav header__nav--mini">
          <ul class="header-top-menu">
            <li><a href="<?php echo home_url('/features/'); ?>">LINKEY とは</a></li>

            <li class="has-submenu">
              <a href="#">製品情報</a>
              <ul class="sub-menu">
                <li><a href="<?php echo home_url('/linkey-plus/'); ?>">LINKEY Plus</a></li>
                <li><a href="<?php echo home_url('/products_linkey-pro/'); ?>">LINKEY Pro</a></li>
              </ul>
            </li>

            <li class="has-submenu">
              <a href="#">活用方法</a>
              <ul class="sub-menu">
                <li><a href="<?php echo home_url('/minpaku-shukuhaku/'); ?>">民泊・簡易宿所</a></li>
                <li><a href="<?php echo home_url('/hotel/'); ?>">ホテル</a></li>
                <li><a href="<?php echo home_url('/rental-space/'); ?>">時間貸しスペース</a></li>
                <li><a href="<?php echo home_url('/mansion/'); ?>">マンション管理</a></li>
              </ul>
            </li>

            <li><a href="<?php echo home_url('/plan/'); ?>">料金</a></li>
            <li><a href="<?php echo home_url('/system/'); ?>">システム連携</a></li>
            <li><a href="<?php echo home_url('/example/'); ?>">導入事例</a></li>
            <li><a href="<?php echo home_url('/news/'); ?>">お知らせ</a></li>
            <li><a href="<?php echo home_url('/column/'); ?>">お役立ち情報</a></li>
            <li class="btn-docs-li">
              <a class="btn-docs" href="<?php echo home_url('/information-request-form/'); ?>">資料請求</a>
            </li>
            <li class="btn-mail-li">
              <a class="btn-mail" href="<?php echo home_url('/contact-form/'); ?>">お問い合わせ</a>
            </li>
          </ul>
        </nav>

        <!-- ▲ 追加ここまで -->
        <button class="header__btn menu-btn" id="menu-btn" aria-controls="menu" aria-expanded="false">
          <span class="menu-btn__line menu-btn__line--top"></span>
          <span class="menu-btn__line menu-btn__line--middle"></span>
          <span class="menu-btn__line menu-btn__line--bottom"></span>
        </button>
      </div>
    </header>

  <div id="bg" class="bg"></div>
    <nav class="page__menu menu" id="menu" inert>
      <div class="menu__inner">
        <a href="<?php echo home_url(); ?>" class="menu__logo">
          <?php
            get_template_part(
              'template-parts/image',
              null,
              array(
                'src' => 'images/logo.png',
                'class' => 'menu__img',
                'alt' => 'ロゴ',
                // ファーストビューの要素は遅延読み込みしない
                'loading' => 'eager',
              )
            );
          ?>
        </a>

        <div class="menu__item">
          <!-- <h3 class="menu__title">LINKEYについて知る</h3> -->
        <?php
  /**
   * メニュー（SP）
   */
  wp_nav_menu( array(
    'menu' => 'header_01',
    'container' => '',
    'menu_class' => 'menu-list',
    'menu_id' => 'menu-list',
    // 2階層まで表示
    'depth' => 2,
    'walker' => new Header_Walker_Nav_Menu,
  ) );
  ?>
          </div>
          <div class="menu__item">
          <h3 class="menu__title">製品情報</h3>
        <?php
  /**
   * メニュー（SP）
   */
  wp_nav_menu( array(
    'menu' => 'header_02',
    'container' => '',
    'menu_class' => 'menu-list',
    'menu_id' => 'menu-list',
    // 2階層まで表示
    'depth' => 2,
    'walker' => new Header_Walker_Nav_Menu,
  ) );
  ?>
          </div>
          <div class="menu__item">
            <h3 class="menu__title">活用方法</h3>
        <?php
  /**
   * メニュー（SP）
   */
  wp_nav_menu( array(
    'menu' => 'header_03',
    'container' => '',
    'menu_class' => 'menu-list menu-list--two',
    'menu_id' => 'menu-list',
    // 2階層まで表示
    'depth' => 2,
    'walker' => new Header_Walker_Nav_Menu,
  ) );
  ?>
          </div>


<div class="menu__item">
      <?php
/**
 * メニュー（SP）
 */
  wp_nav_menu( array(
    'menu' => 'header_04',
    'container' => '',
    'menu_class' => 'menu-list',
    'menu_id' => 'menu-list',
    // 2階層まで表示
    'depth' => 2,
    'walker' => new Header_Walker_Nav_Menu,
  ) );
  ?>
</div>


    <div class="menu-cv menu-cv--file">
      <a href="<?php echo home_url( '/information-request-form/' ); ?>" class="menu-cv__link"></a>
      <h3 class="menu-cv__title">資料請求はこちら</h3>
      <p class="menu-cv__text">導入をご検討中の方向けに、製品仕様や料金プラン、<br class="pc-only">
  活用事例をまとめた資料をご用意しています。</p>
    </div>
    <div class="menu-cv menu-cv--mail">
      <a href="<?php echo home_url( '/contact-form/' ); ?>" class="menu-cv__link"></a>
      <h3 class="menu-cv__title">お問い合わせフォームはこちら</h3>
      <p class="menu-cv__text">製品に関するご質問やお見積り、導入のご相談など、<br class="pc-only">
  こちらからお気軽にお問い合わせください。</p>
    </div>
  </div>
</nav>
