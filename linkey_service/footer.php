<section class="section section--cv">
  <div class="container">
    <div class="cv-flex">
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
  </div>
</section>

<a id="scroller" class="page-top" href="#top">Top Page</a>
<footer class="page__footer footer">
  <div class="container container--wide">

      <a class="footer__logo" href="<?php echo home_url(); ?>" title="ロゴ"><?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo.png',
    'class' => 'footer__img',
    'attr' => array( )
  )
);
?></a>
    <div class="footer__signature">
        <div class="footer__address">
<?php
/*
 * 組織情報
 */
$organization = get_theme_mod( 'aw_template_organization' );
?>
          <div class="org" itemscope itemtype="http://schema.org/Organization">
<?php if( !empty( $organization[ 'name' ] ) ) : ?>
            <h4 class="org__name" itemprop="name"><?php echo $organization[ 'name' ]; ?></h4>
<?php endif; ?>
            <div class="org__addr" itemprop="address" itemscope itemtype="http://schema.org/PostalAddress">
<?php if( !empty( $organization[ 'postal' ] ) ) : ?>
              <span class="org-addr__item" itemprop="postalCode">〒<?php echo $organization[ 'postal' ]; ?></span>
<?php endif; ?>
<?php if( !empty( $organization[ 'region' ] ) ) : ?>
              <span class="org-addr__item" itemprop="addressRegion"><?php echo $organization[ 'region' ]; ?></span>
<?php endif; ?>
<?php if( !empty( $organization[ 'locality' ] ) ) : ?>
              <span class="org-addr__item" itemprop="addressLocality"><?php echo $organization[ 'locality' ]; ?></span>
<?php endif; ?>
<?php if( !empty( $organization[ 'street' ] ) ) : ?>
              <span class="org-addr__item" itemprop="streetAddress"><?php echo $organization[ 'street' ]; ?></span>
<?php endif; ?>
            </div>
<?php if( !empty( $organization[ 'telephone' ] ) ) : ?>
            <span class="org__phone">&nbsp;<a itemprop="telephone" href="tel:<?php echo str_replace( '-', '', $organization[ 'telephone' ] ); ?>"><?php echo $organization[ 'telephone' ]; ?></a></span>
<?php endif; ?>
<?php if( !empty( $organization[ 'fax' ] ) ) : ?>
            <span class="org__fax">FAX.&nbsp;<?php echo $organization[ 'fax' ]; ?></span>
<?php endif; ?>
        </div>
        <ul class="sns-list">
          <li class="sns-list__item"><a href="https://www.youtube.com/channel/UCteV3gQYV5W0fV2gf0VnHmQ" class="sns-list__link sns-list__link--youtube" target="_blank" rel="noopener"></a></li>
        </ul>
      </div>
      <div class="footer__menu">
        <ul class="fnav-list">
          <li class="fnav-list__item">
            <h3 class="fnav-list__title">製品情報</h3>
            <ul class="fchild-list">
              <li class="fchild-list__item"><a href="<?php echo home_url('/linkey-plus/'); ?>" class="fchild-list__link">LINKEY Plus</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url('/products_linkey-pro/'); ?>" class="fchild-list__link">LINKEY Pro</a></li>
            </ul>
          </li>
        </ul>
        <ul class="fnav-list">
          <li class="fnav-list__item">
            <h3 class="fnav-list__title">活用方法</h3>
            <ul class="fchild-list">
              <li class="fchild-list__item"><a href="<?php echo home_url('/minpaku-shukuhaku/'); ?>" class="fchild-list__link">民泊・簡易宿所</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url('/hotel/'); ?>" class="fchild-list__link">ホテル</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url('/rental-space/'); ?>" class="fchild-list__link">時間貸しスペース</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url('/mansion/'); ?>" class="fchild-list__link">マンション管理</a></li>

            </ul>
          </li>
        </ul>
        <ul class="fnav-list">
          <li class="fnav-list__item">
            <ul class="fchild-list">
              <li class="fchild-list__item"><a href="<?php echo home_url( '/features/' ); ?>" class="fchild-list__link">LINKEYとは</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url( '/plan/' ); ?>" class="fchild-list__link">料金</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url( '/system/' ); ?>" class="fchild-list__link">システム連携</a></li>
            </ul>
          </li>
        </ul>
        <ul class="fnav-list">
          <li class="fnav-list__item">
            <ul class="fchild-list">
              <li class="fchild-list__item"><a href="<?php echo get_post_type_archive_link( 'example' ); ?>" class="fchild-list__link">導入事例</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url( '/news/' ); ?>" class="fchild-list__link">お知らせ</a></li>
              <li class="fchild-list__item"><a href="<?php echo home_url( '/column/' ); ?>" class="fchild-list__link">お役立ち情報</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>


    <div class="footer__other">
      <p class="footer__copyright">Copyright &copy;2025 UME Inc. All rights reserved</p>
      <ul class="footer-list">
        <li><a href="<?php echo home_url( '/sitemap/' ); ?>" class="footer-list__link">サイトマップ</a></li>
        <li><a href="<?php echo home_url( '/privacy-policy/' ); ?>" class="footer-list__link">プライバシーポリシー</a></li>
      </ul>
    </div>
  </div>
</footer>


<?php wp_footer(); ?>
</div><!-- wrapper -->
</body>

</html>
