<?php get_header(); ?>

<main class="page__main main main--home">
  <!--
HERO
-->
  <section class="mv">
    <div class="mv__container">
      <picture>
        <source srcset="<?php echo get_theme_file_uri( 'images/fv.png' ); ?>" media="(min-width: 768px)" width="1920" height="1000">
        <img class="mv__bg" src="<?php echo get_theme_file_uri( 'images/fv_sp.png' ); ?>" width="780" height="1160" alt="FV画像">
      </picture>
      <div class="mv__message message">
        <h1 class="message__title">
          <span class="message__title-min">施設運営を無人化・効率化<span class="sp-only">するスマートロック</span></span>
          <span class="sp-none">スマートロック </span><!--<br class="pc-none">--><span class="message__title-blue"><span>LINKEY</span></span>
        </h1>
        <div class="message__contents">
          <p class="message__desc">予約・受付業務の負担を減らし、ユーザーの満足度も向上。<br>24,000台以上の導入実績。</p>
            <?php
            get_template_part(
              'template-parts/image',
              null,
              array(
                'src' => 'images/no1.png',
                'class' => 'img-responsive message__proof',
                'alt' => '民泊・簡易宿所３年連続シェアNo.1',
              )
            );
            ?>
            <small class="message__small">
              ※出典：デロイト トーマツ ミック経済研究所株式会社「省人化・無人化DXソリューション市場の実態と展望 2024年度版」
            </small>
        </div>
      </div>
      <div class="mv__cv">
        <a href="<?php echo home_url( '/features/' ); ?>" class="btn btn--wt">3分でわかる<br class="sp-only">LINKEYの特徴</a>
        <a href="<?php echo home_url( '/information-request-form/' ); ?>" class="btn">まずは資料<br class="sp-only">ダウンロード</a>
      </div>
    </div>
  </section>

  <section class="section section--intro lazy">
    <div class="container">
      <div class="dounyu">
        <p class="underline-txt">民泊、簡易宿所、ホテルや時間貸しスペース、マンション管理で</p><br>
        <span class="dounyu__title">導入実績</span>
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/24000.png',
    'class' => 'img-responsive dounyu__txtimg',
    'alt' => '24,000台以上',
  )
);
?>
          <p class="dounyu__desc">LINKEYシリーズを導入しているお客様が続々と増えています！</p>
        </div>
      </div>

        <div class="splide" role="group" aria-label="流れる自動スライダー" id="auto-scroll">
          <div class="splide__track">
            <ul class="splide__list">
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-01.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-02.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-03.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-04.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-05.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-06.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-07.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-08.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
              <li class="splide__slide">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/company-logo-09.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              </li>
            </ul>
          </div>
        </div>

  </section>



  <section class="section section--about lazy">
    <div class="container container--wide">
      <div class="dot-box">
        <div class="dot-box__row">
          <div class="dot-box__row-item">
          <?php
  get_template_part(
    'template-parts/image',
    null,
    array(
      'src' => 'images/about01.png',
      'class' => 'ad-img',
      'attr' => array( 'data-sample' => 'test' )
    )
  );
  ?>

          </div>
          <div class="dot-box__row-item">
            <div class="section__header">
              <h2 class="h2 h2--bk">暗証番号で解錠。鍵の受け渡し不要。<br>受付スタッフがいなくても、安心でスムーズな運営が可能に。</h2>
            </div>
            <p class="section__description">
              LINKEYシリーズは、民泊やホテル、時間貸しスペースなど、あらゆる施設の運営に必要な機能を備えた暗証番号式のスマートロックです。物理的な鍵を使わず、暗証番号でドアの施錠・解錠ができるため、施設の無人運営や遠隔管理を可能にします。スタッフが行う受付業務（鍵の受け渡し）の手間を削減し、有人対応と同等以上の利便性と安全性を実現。シンプルな設計にこだわり「使いやすく、しかもリーズナブル」な製品です。
            </p>
            <div class="section__footer section__footer--mt-min section__footer--om-center">
              <a href="<?php echo home_url( '/features/' ); ?>" class="btn">3分でわかるLINKEYの特徴</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>


  <section class="section section--kadai lazy">
    <div class="container">
      <div class="section__header">
        <h2 class="section__title">各施設の運営課題に<br>合わせて使えるスマートロック</h2>
      </div>
      <p class="section__description">
        受付対応や鍵のトラブル、セキュリティ管理──。そんな運営のお悩みありませんか？<br>LINKEYは予約から利用終了までの、鍵管理に必要な機能を備え、各施設の運営課題に合わせた解決方法をご提案可能です。
      </p>
      <div class="section__body">
        <div class="splide fv__slider" id="card-slider">
        <div class="splide__track">
        <ul class="splide__list">
          <li class="splide__slide">
            <article class="thmb-card thmb-card--link">
              <a href="<?php echo home_url( '/minpaku-shukuhaku/' ); ?>" class="thmb-card__link">&nbsp;</a>
              <h2 class="thmb-card__title">民泊／簡易宿所</h2>
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/illust01.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              <span class="thmb-card__copy">このような方におすすめ</span>
              <ul class="thmb-card__list">
                <li>運営を遠隔化・無人化したい</li>
                <li>扱いやすくてリーズナブルな製品がいい</li>
                <li>完全無人でも安心なトラブルサポートがほしい</li>
              </ul>
              <span class="thmb-card__btn">詳細を見る</span>
            </article>
          </li>
          <li class="splide__slide">
            <article class="thmb-card thmb-card--link">
              <a href="<?php echo home_url( '/hotel/' ); ?>" class="thmb-card__link">&nbsp;</a>
              <h2 class="thmb-card__title">ホテル／旅館</h2>
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/illust02.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              <span class="thmb-card__copy">このような方におすすめ</span>
              <ul class="thmb-card__list">
                <li>フロント業務を効率化して人件費を抑えたい</li>
                <li>繁忙期・閑散期に左右されない運営方法にしたい</li>
                <li>初めて使うゲストにもやさしいスマートロック</li>
              </ul>
              <span class="thmb-card__btn">詳細を見る</span>
            </article>
          </li>
          <li class="splide__slide">
            <article class="thmb-card thmb-card--link">
              <a href="<?php echo home_url( '/rental-space/' ); ?>" class="thmb-card__link">&nbsp;</a>
              <h2 class="thmb-card__title">時間貸しスペース</h2>
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/illust03.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              <span class="thmb-card__copy">このような方におすすめ</span>
              <ul class="thmb-card__list">
                <li>無人運営で24時間スペースを稼働させたい</li>
                <li>利用時間外のセキュリティを守りたい</li>
                <li>ランニングコストを抑えて利益アップしたい</li>
              </ul>
              <span class="thmb-card__btn">詳細を見る</span>
            </article>
          </li>
          <li class="splide__slide">
            <article class="thmb-card thmb-card--link">
              <a href="<?php echo home_url( '/mansion/' ); ?>" class="thmb-card__link">&nbsp;</a>
              <h2 class="thmb-card__title">マンション管理</h2>
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/illust04.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
              <span class="thmb-card__copy">このような方におすすめ</span>
              <ul class="thmb-card__list">
                <li>退去時の鍵の交換をなくしたい</li>
                <li>低コストでセキュリティを強化したい</li>
                <li>原状回復できるように穴開け工事なしがいい</li>
              </ul>
              <span class="thmb-card__btn">詳細を見る</span>
            </article>
          </li>
        </ul>
      </div>
      </div>
      </div>
    </div>
  </section>


  <section class="section section--lineup lazy">
    <div class="container">
      <div class="section__header">
        <h2 class="section__title">施設規模にも対応した<br>製品ラインナップ</h2>
      </div>
      <div class="section__body">
          <article class="lineup">
            <div class="lineup__inner">
              <div class="lineup__tagwrap"><span class="lineup__tag">小規模施設向け</span><span class="lineup__tag">1〜3台の導入でお得</span></div>
              <h2 class="lineup__title">LINKEY <span class="redtxt">Plus</span></h2>
              <p class="lineup__desc">小規模施設向けモデル。必要な機能が過不足なく揃っているシンプルな設計です。余計な機能がないからこそ市場価格の約1/2へコストカットを実現。ドアへの穴開け不要で1部屋から導入できるため試しやすい製品です。</p><div><a href="<?php echo home_url('/linkey-plus/'); ?>" class="lineup__btn">製品情報を見る</a></div></div>
          </article>
          <article class="lineup lineup--02">
            <div class="lineup__inner">
              <div class="lineup__tagwrap"><span class="lineup__tag">中〜大規模施設向け</span><span class="lineup__tag">4台以上の導入でお得</span></div>
              <h2 class="lineup__title">LINKEY <span class="bluetxt">Pro</span></h2>
              <p class="lineup__desc">中〜大規模施設向けモデル。必要な機能をしっかりと備えながら、複数部屋の通信環境を安定させる通信機器を採用。1つの通信機器で複数ドアを一元管理できるため、1台あたりのランニングコストを抑えることができます。</p><div><a href="<?php echo home_url('/products_linkey-pro/'); ?>" class="lineup__btn">製品情報を見る</a></div></div>
          </article>
      </div>
    </div>
  </section>

  <section class="section section--bg lazy">
    <div class="container">
      <div class="section__header">
        <h2 class="section__title section__title--mtnon">各施設でお使いの<br>予約・管理システムと連携可能</h2>
      </div>
      <p class="section__description">
        LINKEYは、さまざまな予約システムやチェックインシステムとAPI連携が可能です。<br>予約時の暗証番号発行・通知を自動化することで、予約から退室まで一連の鍵管理の手間を削減します。
      </p>
      <small class="small small--gray">※その他のシステムとも連携を順次拡大中です。詳細はお問い合わせください。</small>
      <div class="section__body">
        <ul class="logo-list">
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-01.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-02.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-03.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-04.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-05.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-06.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-07.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-08.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
          <li class="logo-list__item">
<?php
get_template_part(
  'template-parts/image',
  null,
  array(
    'src' => 'images/logo-09.png',
    'class' => 'img-responsive',
    'alt' => '',
  )
);
?>
          </li>
        </ul>
      </div>
      <div class="section__footer section__footer--btn-center">
        <a href="<?php echo home_url( '/system/' ); ?>" class="btn">システム連携について</a>
      </div>
    </div>
  </section>


  <?php
/**
 * 導入事例
 */
$example = new WP_Query(array(
'post_type' => 'example',
'posts_per_page' => 3
  ));
  if( $example->have_posts() ) :
?>
    <section class="section section--customer lazy">
    <div class="container">
      <h2 class="section__title">最新情報を配信中</h2>
      <div class="section__header section__header--flex">
        <h2 class="h2 h2--bk">LINKEYサービスを導入しているお客様のご紹介</h2>
        <a href="<?php echo get_post_type_archive_link( 'example' ); ?>" class="btn">導入事例一覧を見る</a>
      </div>
        <div class="archive-list">
          <?php
    while( $example->have_posts() ) : $example->the_post();
      get_template_part( 'template-parts/pickup-card', null );
    endwhile;
    wp_reset_postdata();
  ?>
        </div>
    </div>
  </section>

  <?php
endif;
?>

  <?php
/**
 * お役立ち情報
 */
$column = new WP_Query(array(
'post_type' => 'column',
'posts_per_page' => 3
));
if( $column->have_posts() ) :
?>
  <section class="section section--column lazy">
    <div class="container">
      <div class="section__header section__header--flex">
        <h2 class="h2 h2--bk">お役立ち情報</h2>
        <a href="<?php echo get_post_type_archive_link( 'column' ); ?>" class="btn">お役立ち情報を見る</a>
      </div>
      <div class="archive-list">
        <?php
    while( $column->have_posts() ) : $column->the_post();
    get_template_part( 'template-parts/column-card', null );
    endwhile;
    wp_reset_postdata();
?>
      </div>
    </div>
  </section>
  <?php
endif;
?>


  <?php
/**
 * 最新情報
 */
$news = new WP_Query(array(
'post_type' => 'news',
'posts_per_page' => 3
));
if( $news->have_posts() ) :
?>
  <section class="section section--news lazy">
    <div class="container">
      <div class="section__header section__header--flex">
        <h2 class="h2 h2--bk">お知らせ</h2>
        <a href="<?php echo get_post_type_archive_link( 'news' ); ?>" class="btn">お知らせ一覧を見る</a>
      </div>
      <div class="archive-list">
        <?php
  while( $news->have_posts() ) : $news->the_post();
    get_template_part( 'template-parts/news-card', null );
  endwhile;
  wp_reset_postdata();
?>
      </div>
    </div>
  </section>
  <?php
endif;
?>




</main>

<?php get_footer(); ?>
