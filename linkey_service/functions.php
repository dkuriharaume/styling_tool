<?php
/*
 * コンテンツ幅を設定
 */
function aw_content_width() {
  $GLOBALS['content_width'] = 1024;
}
add_action( 'after_setup_theme', 'aw_content_width', 0 );

/*
 * 生成する画像サイズを設定
 */
function aw_init_image_sizes() {
  // アイキャッチをサポート
  add_theme_support( 'post-thumbnails' );

  // thumbnail
  // add_image_size( 'thumbnail', 480, 480, true );
  // iPhone6,7,8(375x2)
  // add_image_size( 'medium', 750, 9999, false );
  // content_width
  // add_image_size( 'large', $GLOBALS['content_width'], 9999, false );
  // laptop
  add_image_size( 'medium_large', 1366, 9999, false );
  // desktop
  add_image_size( 'desktop', 1920, 9999, false );
  // laptop2x
  add_image_size( 'laptop2x', 2732, 9999, false );
  // desktop2x
  add_image_size( 'desktop2x', 3840, 9999, false );

  // remove size
  remove_image_size( '1536x1536' );
  remove_image_size( '2048x2048' );

}
add_action( 'after_setup_theme', 'aw_init_image_sizes', 0 );

/*
 * テーマ有効化時にデフォルト画像サイズを変更
 */
function aw_change_reserved_image_sizes() {
  // thumbnail
  update_option( 'thumbnail_size_w', 480 );
  update_option( 'thumbnail_size_h', 480 );
  // iPhone6,7,8(375x2)
  update_option( 'medium_size_w', 750 );
  update_option( 'medium_size_h', 0 );
  // content_width
  update_option( 'large_size_w', $GLOBALS['content_width'] );
  update_option( 'large_size_h', 0 );
}
add_action( 'after_switch_theme', 'aw_change_reserved_image_sizes' );

/*
 * 大きい画像でも勝手に縮小しない（ -scaled を生成しない）
 */
add_filter( 'big_image_size_threshold', '__return_false' );

/*
 * 画像の sizes 属性にコンテンツ幅を指定
 */
function aw_calculate_image_sizes( $sizes ) {
  $sizes = sprintf( '(max-width: %1$dpx) 100vw, %1$dpx', $GLOBALS['content_width'] );
  return $sizes;
}
add_filter( 'wp_calculate_image_sizes', 'aw_calculate_image_sizes' );


function customizer_setup() {

  // タイトルタグを自動表示
  add_theme_support( 'title-tag' );

  // 固定ページでの抜粋をサポート
  add_post_type_support( 'page', 'excerpt' );

  // テーマで利用するメニューを登録
  register_nav_menus(
    array(
      'header' => 'ヘッダーメニュー',
      'footer' => 'フッターメニュー',
    )
  );

  // 部品をhtml5に対応させる
  add_theme_support(
    'html5',
    array(
      'search-form',
      'comment-form',
      'comment-list',
      'gallery',
      'caption',
    )
  );

  // カスタムロゴをサポート
  add_theme_support(
    'custom-logo',
    array(
      'width'      => 250,
      'height'     => 250,
      'flex-width' => true,
    )
  );

  add_theme_support(
    'custom-header',
    array(
      'default-image'    => get_parent_theme_file_uri( '/images/1200x900.png' ),
      'width'            => 2000,
      'height'           => 1200,
      'flex-height'      => true,
      'video'            => true,
    )
  );

  // ウィジェット編集ショートカットをサポート
  add_theme_support( 'customize-selective-refresh-widgets' );

  // ビジュアルエディタにスタイルを適用
  add_editor_style( get_stylesheet_directory_uri() . '/css/style.min.css' );

}
add_action( 'after_setup_theme', 'customizer_setup' );


/*
 * 不要なwp_headerアクションフィルタ
 */
// Head 内に REST API のエンドポイントを出力させない
remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );
// リクエストヘッダーに REST API のエンドポイントを出力させない
remove_action( 'template_redirect', 'rest_output_link_header', 11 );
// RSD(Really Simple Discovery) リンクを削除
remove_action( 'wp_head', 'rsd_link' );
// Windows Live Writer を使ってブログ投稿する機能を削除
remove_action( 'wp_head', 'wlwmanifest_link' );
// wordpressのバージョンを表示する機能を削除
remove_action( 'wp_head', 'wp_generator' );
// フィードリンクを削除
remove_action( 'wp_head', 'feed_links', 2 );
remove_action( 'wp_head', 'feed_links_extra', 3 );
// next prev 属性を削除
remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10, 0 );
// ショートリンクを削除
remove_action( 'wp_head', 'wp_shortlink_wp_head', 10, 0 );
// デフォルトの rel canonical を削除
remove_action( 'wp_head', 'rel_canonical' );
// emoji を使わない
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
remove_action( 'admin_print_styles', 'print_emoji_styles' );
// Embed系のタグを削除
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'wp_oembed_add_host_js' );

/**
 * スタイルシートとスクリプトの読み込み
 */
function customizer_scripts() {

  wp_enqueue_style( 'aw-fonts', 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Roboto:wght@400;700&display=swap', array( ), null );
  wp_enqueue_style( 'aw-style', get_theme_file_uri( 'css/style.min.css' ), array( ), null );
  if( ! is_admin() ) {
    global $wp_scripts;
    $jquery = $wp_scripts->registered['jquery-core'];
    // ブロックエディタ用のCSSを読み込まない
    wp_dequeue_style( 'wp-block-library' );
    wp_dequeue_style( 'global-styles' );
    wp_dequeue_style( 'classic-theme-styles' );
    // デフォルトの jQuery を削除
    wp_deregister_script( 'jquery' );
    wp_deregister_script( 'jquery-core' );
    // CDN経由で jQuery を読み込む
    wp_register_script( 'jquery', false, ['jquery-core'], $jquery->ver, true );
    wp_register_script( 'jquery-core', 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js', [], $jquery->ver, );
    // jQuery に依存した js ファイルを読み込む
    wp_enqueue_script( 'aw-jquery-magnific', get_theme_file_uri( 'js/jquery.magnific-popup.min.js' ), array( 'jquery' ), null );
    wp_enqueue_script( 'aw-js-splide', get_theme_file_uri( 'js/splide.min.js' ), array( 'jquery' ), null );
    // splideでautoscrollしないなら以下の一行は不要
    wp_enqueue_script( 'aw-splide-autoscroll', 'https://cdn.jsdelivr.net/npm/@splidejs/splide-extension-auto-scroll@0.5.3/dist/js/splide-extension-auto-scroll.min.js', array( 'jquery' ), null );
    wp_enqueue_script( 'aw-js-micromodal', get_theme_file_uri( 'js/micromodal.min.js' ), array( 'jquery' ), null );
    wp_enqueue_script( 'aw-js-inview', get_theme_file_uri( 'js/jquery.inview.min.js' ), array( 'jquery' ), null );
    // wp_enqueue_script( 'aw-js-gsap', get_theme_file_uri( 'js/gsap.min.js' ), array( 'jquery' ), null );
    // wp_enqueue_script( 'aw-js-scrolltimeline', get_theme_file_uri( 'js/scroll-timeline.js' ), array( 'jquery' ), null );
    wp_enqueue_script( 'aw-scripts', get_theme_file_uri( 'js/scripts.js' ), array( 'jquery' ), null );
  }
}
add_action('wp_enqueue_scripts', 'customizer_scripts');


/*
 * レンダリングを妨げないようにCSS読み込み
 */
function aw_preload_css( $rtl_tag, $handle, $rtl_href, $media ) {
  // 管理画面は対象外
  if( is_admin() ) {
    return $rtl_tag;
  }
  $html = $rtl_tag;
  if( strpos( $html, get_theme_file_uri( 'css/style' ) ) === false ) {
    $html = sprintf(
      "<link rel=\"preload\" as=\"style\" href=\"%s\" media=\"%s\" onload=\"this.onload=null;this.rel='stylesheet'\" />\n",
      $rtl_href,
      $media
    );
  }
  if( strpos( $html, 'fonts.googleapis.com' ) !== false ) {
    $html_array = array(
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      $html,
    );
    $html = implode( "\n", $html_array );
  }
  return $html;
}
add_filter( 'style_loader_tag', 'aw_preload_css', 10, 4 );

/*
 * scriptタグを遅延読み込み
 */
function aw_defer_scripts( $tag, $handle, $src ) {
  $ret = $tag;
  if( ! is_admin() ) {
    $ret = sprintf( "<script src=\"%s\" defer></script>\n", $src );
  }
  return $ret;
}
add_filter( 'script_loader_tag', 'aw_defer_scripts', 10, 3 );

/**
 * 自動スラッグ生成
 */
function aw_auto_post_slug( $slug, $post_id, $post_status, $post_type ) {
  if ( preg_match( '/(%[0-9a-f]{2})+/', $slug ) ) {
    $slug = utf8_uri_encode( $post_type ) . '-' . $post_id;
  }
  return $slug;
}
add_filter( 'wp_unique_post_slug', 'aw_auto_post_slug', 10, 4 );

/**
 * アイキャッチをenclosureに設定。
 */
function aw_rss2_item() {
  global $post;
  if( has_post_thumbnail( $post->ID ) ) {
    $url = wp_get_attachment_image_url( get_post_thumbnail_id( $post->ID ), 'full' );
    $file = get_attached_file( get_post_thumbnail_id( $post->ID ), true );
    $file_type = wp_check_filetype( $file );
    echo '<enclosure url="' . esc_url( trim( $url ) ) . '" length="' . filesize( $file ) . '" type="' . $file_type['type'] . '" />' . "\n";
  }
}
add_action( 'rss2_item', 'aw_rss2_item' );



/**
 * ヘッダー用ナビゲーション
 */
class Header_Walker_Nav_Menu extends Walker_Nav_Menu {
  public function start_lvl( &$output, $depth = 0, $args = array() ) {
    $menu_classes = explode( ' ', $args->menu_class );
    $classes = array();
    $classes[] = 'child-list';
    $output .= '<button class="trigger ' . $menu_classes[0] . '__trigger"></button>';
    $output .= '<div class="' . $menu_classes[0] . '__child">';
    $output .= '<div class="' . $menu_classes[0] . '__child-inner">';
    $output .= '<ul class="' . implode( ' ', $classes ) . '">';
  }

  public function end_lvl( &$output, $depth = 0, $args = array() ) {
    $output .= '</ul>';
    $output .= '</div>';
    $output .= '</div>';
  }

  public function start_el( &$output, $item, $depth = 0, $args = array(), $id = 0 ) {
    $link_classes = $item_classes = array();
    $menu_classes = explode( ' ', $args->menu_class );
    if( $depth != 0 )
      $menu_classes[0] = 'child-list';
    $item_classes[] = $menu_classes[0] . '__item';
    $link_classes[] = $menu_classes[0] . '__link';
    // 管理画面で指定される class 名を追加
    if( !empty( $item->classes[0] ) )
      $link_classes[] = $item->classes[0];
    if( $item->current_item_ancestor )
      $link_classes[] = $menu_classes[0] . '__link--ancestor';
    if( $item->current )
      $link_classes[] = $menu_classes[0] . '__link--current';

    $target = !empty( $item->target ) ? 'target="_blank" rel="noopener"' : '';
    $output .= '<li class="' . implode( ' ', $item_classes ) . '">';
    $output .= '<a class="' . implode( ' ', $link_classes ) . '" href="' . $item->url . '" ' . $target . ' data-en="' . $item->attr_title . '">' . $item->title . '</a>';
  }

  public function end_el( &$output, $item, $depth = 0, $args = array() ) {
    $output .= '</li>';
  }
}


/**
 * Customizer additions.
 */
require get_parent_theme_file_path( '/inc/aw_option_customizer.php' );
require get_parent_theme_file_path( '/inc/aw_opengraph_customizer.php' );
require get_parent_theme_file_path( '/inc/aw_organization_customizer.php' );

/* 募集要項の投稿タイプの読み込み */
//require get_parent_theme_file_path( '/inc/aw_jobs_template.php' );


function aw_document_title_parts( $title ) {
  if( is_home() ) {
    $title['tagline'] = get_option( 'sub_title' );
  }
  if( is_tax() ) {
    $qo = get_queried_object();
    if( $qo->parent ) {
      $parent = get_term( $qo->parent, $qo->taxonomy );
      $title['title'] .= ' ' . $parent->name;
    }
    $taxonomy = get_taxonomy( $qo->taxonomy );
    if( !empty( $taxonomy->object_type ) ) {
      $post_type_object = get_post_type_object( $taxonomy->object_type[0] );
      $title['title'] .= ' ' . $post_type_object->label;
    }
  }

  return $title;
}
add_filter( 'document_title_parts', 'aw_document_title_parts', 10, 1 );


function aw_get_current_url() {
  global $wp;
  $current_slug = add_query_arg( array(), $wp->request );
  return home_url( $current_slug );
}


/*---------------------------------------------------------------------------
 * Canonicalタグ
 *---------------------------------------------------------------------------*/
function aw_the_canonical_url() {

  $canonical_url = null;

  switch( true ) {
    case is_home() || is_front_page():
      $canonical_url = home_url();
      break;
    case is_singular():
      $canonical_url = get_permalink();
      break;
    case is_post_type_archive() :
      $post_type = get_query_var( 'post_type' );
      $canonical_url = get_post_type_archive_link( $post_type );
      break;
    case is_category():
      $canonical_url = get_category_link( get_query_var( 'cat' ) );
      break;
    case is_tag():
      $canonical_url = get_tag_link( get_query_var( 'tag_id' ) );
      break;
    case is_author():
      $canonical_url = get_author_posts_url( get_query_var( 'author' ), get_query_var( 'author_name' ) );
      break;
    case is_year():
      $canonical_url = get_year_link( get_the_time('Y') );
      break;
    case is_month():
      $canonical_url = get_month_link( get_the_time('Y'), get_the_time('m') );
      break;
    case is_day():
      $canonical_url = get_day_link( get_the_time('Y'), get_the_time('m'), get_the_time('d') );
      break;
    default:
      break;
  }

  if ( null !== $canonical_url ) {
    return '<link rel="canonical" href="'.esc_url( $canonical_url ).'" />';
  } else {
    return '';
  }
}


/*
 * Descriptionタグ
 */
function aw_the_description_tag() {

  $description = '';

  if ( is_front_page() || is_home() ) {
    $description = get_bloginfo( 'description' );
  } elseif ( is_singular() && has_excerpt() ) {
    $description = get_the_excerpt();
  } elseif ( is_archive() ) {
    $description = str_replace("\n", "", get_the_archive_description() );
  }

  return '<meta name="description" content="' . strip_tags( $description ) . '">';
}


/*
 * headタグ
 */
function aw_head_scripts() {
  $html = array();
  $html[] = aw_the_canonical_url();
  $html[] = aw_the_description_tag();
  // noindex
  if ( is_search() || is_date() || is_author() ) {
    $html[] = '<meta name="robots" content="noindex, nofollow">';
  }
  echo implode( "\n", $html ) . "\n";
}

add_action( 'wp_head', 'aw_head_scripts', 1 );

/*
 * どのユーザーでもデフォルトでツールバーを非表示
 */
add_filter('show_admin_bar', '__return_false');


/*
 * ページ送り
 */
function get_custom_single_pager( $class = 'single-pager-list' ) {
  if( ! $post = get_post() )
    return null;

  $html = '';
  $html .= '<a class="btn btn--back" href="' . get_post_type_archive_link( $post->post_type ) . '">一覧へ戻る</a>';
  $html = '<div class="btn-wrap btn-wrap--center pager-wrap">' . $html . '</div>';

  return $html;
}

function get_custom_pager( $pages = '', $range = 2, $prev = '<', $next = '>' ) {
  $html = '';
  $showitems = ($range * 2)+1;
  global $paged;
  if(empty($paged)) $paged = 1;

  if($pages == '') {
    global $wp_query;
    $pages = $wp_query->max_num_pages;
    if(!$pages) {
      $pages = 1;
    }
  }

  if(1 != $pages) {
    $html .= '<ul class="pager-list">';
    // prevボタン
    if($paged > 1) :
      $html .= '<li class="pager-list__item pager-list__item--prev">';
      $html .= '<a class="pager-list__link pager-list__link--prev" href="'.get_pagenum_link($paged - 1).'"></a>';
      $html .= '</li>';
    endif;

    // 番号ボタン
    for ($i=1; $i <= $pages; $i++)
    {
      if (1 != $pages &&( !($i >= $paged+$range+1 || $i <= $paged-$range-1) || $pages <= $showitems ))
      {
        $classes = array( 'pager-list__link', 'pager-list__link--number' );
        $html .= '<li class="pager-list__item">';
        if( $paged == $i )
          $classes[] = 'pager-list__link--active';
        $html .= '<a class="' . implode( ' ', $classes ) . '" href="'.get_pagenum_link( $i ).'">' . sprintf("%01d", $i) . '</a></li>';
        $html .= '</li>';
      }
    }

    // nextボタン
    if ($paged < $pages) :
      $html .= '<li class="pager-list__item pager-list__item--next">';
      $html .= '<a class="pager-list__link pager-list__link--next" href="'.get_pagenum_link($paged + 1).'"></a>';
      $html .= '</li>';
    endif;
    $html .= "</ul>\n";
  }
  return $html;
}


/**
 * 一覧でターム名出力
 */
function custom_archive_title( $title ){
  global $wp_query;

  if ( is_tax() || is_category() || is_tag() ) {
    $title = single_term_title( '', false );
  }
  return $title;
}
add_filter( 'get_the_archive_title', 'custom_archive_title', 10 );






/**
 * 新しい投稿かどうか
 */
function is_new( $post ) {
  if( ! $post = get_post( $post ) )
    return null;

  $ret = false;
  $date = 7;

  $timestamp = get_the_time( 'U', $post );
  $newstamp = mktime(
    date( 'H', time() ),
    date( 'i', time() ),
    date( 's', time() ),
    date( 'n', time() ),
    date( 'j', time() ) - $date,
    date( 'Y', time() )
  );
  if( $timestamp > $newstamp ) $ret = true;

  return $ret;
}


/*
 * カード表示ショートコード
 * template : カードに使用するテンプレート名
 * post_type : 表示対象の投稿タイプ。カンマ区切りで複数指定可能
 * taxonomy : 表示対象のタクソノミー
 * terms : 表示対象のターム。カンマ区切りで複数指定可能
 * orderby : 表示順序（ランダムは rand ）
 * posts_per_page : 表示件数
 */
function get_cards( $atts ) {
  global $post;
  $html = '';

  // 投稿ページでなければ終了
  if( ! $post = get_post() )
    return null;

  // 初期値を定義
  extract(
    shortcode_atts(
      array(
        'template' => 'pickup-card',
        'post_type' => $post->post_type,
        'taxonomy' => null,
        'terms' => null,
        'ids' => array(),
        'orderby' => 'date',
        'posts_per_page' => 10,
        'mobile' => 12,
        'tablet' => 6,
        'desktop' => 4
      ),
      $atts
    )
  );
  // 表示するテンプレートが無ければ終了
  if( empty( locate_template( 'template-parts/' . $template . '.php' ) ) )
    return null;

  // 投稿タイプと表示順を設定
  // 投稿タイプはカンマ区切りで指定可能
  $args = array(
    'post_type' => explode( ',', $post_type ),
    'orderby' => $orderby,
    'posts_per_page' => $posts_per_page,
  );
  // ID指定の場合
  if( !empty( $ids ) ) {
    $args[ 'post__in' ] = explode( ',', $ids );
    $args[ 'orderby' ] = 'post__in';
  }
  // ターム・タクソノミーを設定（タームはカンマ区切りで指定可能）
  if( !empty( $taxonomy ) && !empty( $terms ) ) {
    $args[ 'tax_query' ] = array(
      array(
        'taxonomy' => $taxonomy,
        'field' => 'slug',
        'terms' => explode( ',', $terms ),
      )
    );
  }
  $cards = new WP_Query( $args );

  // ob_get_clean までを表示せずにバッファしておく
  ob_start();
  if( $cards->have_posts() ) :
    while( $cards->have_posts() ) : $cards->the_post();
      get_template_part( 'template-parts/' . $template );
    endwhile;
    wp_reset_postdata();
  endif;

  // ob_start からの全表示パーツを返す
  return ob_get_clean();
}
add_shortcode( 'cards', 'get_cards', 10, 1 );


/**
 * 子ページ children_card
 *
 */
function get_children_card( $atts ) {
  global $post;
  $html = '';

 if( ! $post = get_post() )
    return null;

  extract(shortcode_atts(array(
    'parent' => $post->ID,
    'ids' => null,
    'template' => 'children-card',
    'mobile' => 12,
    'tablet' => 6,
    'desktop' => 4
  ), $atts ));

  // 表示するテンプレートが無ければ終了
  if( empty( locate_template( 'template-parts/' . $template . '.php' ) ) )
    return null;

  if( !empty( $ids ) ) {
    $ids = explode( ',', $ids );
    $children = get_posts(
      array(
        'post_type' => 'page',
        'posts_per_page' => -1,
        'post__in' => $ids,
        'orderby' => 'post__in',
        'order' => 'ASC'
      )
    );
  } else {
    $children = get_posts(
      array(
      'post_type' => 'page',
      'posts_per_page' => -1,
      'post_parent' => $parent,
      'post__not_in' => array($post->ID),
      'orderby' => 'menu_order',
      'order' => 'ASC'
      )
    );
  }
  ob_start();
  if( $children ) {
    echo '<div class="row row--wide">';
    foreach( $children as $child ) {
      // レイアウト枠
      echo '<div class="row__item row__item--mobile-'. $mobile . ' row__item--tablet-'. $tablet . ' row__item--desktop-'. $desktop. '">';
      get_template_part( 'template-parts/' . $template, null, array( 'post_id' => $child->ID ) );
      echo '</div>';
    }
    echo '</div>';
  }
  return ob_get_clean();
}
add_shortcode( 'children_card', 'get_children_card', 10, 1 );

function get_parts( $atts ) {
  // 初期値を定義
  extract(
    shortcode_atts(
      array(
        'template' => '',
        'post_id' => 0,
      ),
      $atts
    )
  );

  // 表示するテンプレートが無ければ終了
  if( empty( $template ) || empty( locate_template( 'template-parts/' . $template . '.php' ) ) )
    return null;

  ob_start();
  get_template_part( 'template-parts/' . $template, null, array( 'post_id' => $post_id ) );
  return ob_get_clean();
}
add_shortcode( 'parts', 'get_parts', 10, 1 );

/**
 * サイトマップ
 *
 */
function get_sitemap_children( $type = 'page', $excludes = array(), $parent = 0 ) {
  $html = '';
  $children = new WP_Query(
    array(
      'post_type' => $type,
      'posts_per_page' => -1,
      'orderby' => 'menu_order',
      'order' => 'ASC',
      'post_parent' => $parent,
      'post__not_in' => $excludes,
    )
  );
  if( $children->have_posts() ) :
    $post_type_object = get_post_type_object( $type );
    while( $children->have_posts() ) : $children->the_post();
      $html .= '<li><a href="' . get_permalink( get_the_ID() ) . '">' . get_the_title() . '</a>';
      $html .= get_sitemap_children( get_post_type(), $excludes, get_the_ID() );
      $html .= '</li>';
    endwhile;
    wp_reset_postdata();
    if( $post_type_object->has_archive || $parent !== 0 ) {
      $html = '<ul class="ul">' . $html . '</ul>';
    }
  endif;
  return $html;
}

function get_sitemap( $atts ) {
  // 初期値を定義
  extract(
    shortcode_atts(
      array(
        'post_types' => 'page',
        'excludes' => '',
      ),
      $atts
    )
  );
  $post_types = explode( ',', $post_types );
  $excludes = explode( ',', $excludes );
  $html = '<ul class="ul">';
  foreach( $post_types as $pt ) {
    $post_type_object = get_post_type_object( $pt );
    if( $post_type_object ) {
      if( $post_type_object->public ) {
        if( $post_type_object->has_archive ) {
          $html .= '<li><a href="' . get_post_type_archive_link( $pt ) . '">' . $post_type_object->label . '</a>';
        }
        if( $post_type_object->hierarchical ) {
          $html .= get_sitemap_children( $pt, $excludes );
        }
        if( $post_type_object->has_archive ) {
          $html .= '</li>';
        }
      }
    }
  }
  $html .= '</ul>';
  return $html;
}
add_shortcode( 'sitemap', 'get_sitemap' );


/**
 * 外部プレビュー有効期限を30日間にのばす
 */
add_filter( 'ppp_nonce_life', 'my_nonce_life' );
function my_nonce_life() {
  return 60 * 60 * 24 * 30;	// 30 日間（秒×分×時間×日）
}


/**
 * タイトル取得
 */
function get_hero() {
  $hero = [];
  $hero_type = '';

  if( is_404() ) {
    $hero_type = '404';
  } elseif( is_search() ) {
    $hero_type = 'search';
  } elseif( is_post_type_archive() ) {
    $post_type_archive = get_queried_object();
    $hero_type = 'post-type-archive';
  } elseif( is_tax() || is_category() || is_tag() ) {
    $term = get_queried_object();
    $taxonomy = get_taxonomy( $term->taxonomy );
    $post_type_archive = !empty( $taxonomy->object_type ) ? get_post_type_object( $taxonomy->object_type[0] ) : null;
    if( $post_type_archive ) {
      $hero_type = 'post-type-archive';
    } else {
      $hero_type = 'taxonomy';
    }
  } elseif( is_singular() ) {
    $post_type_archive = get_post_type_object( get_post_type() );
    if( $post_type_archive->has_archive ) {
      $hero_type = 'post-type-archive';
    } else {
      $hero_type = 'singular';
    }
  }
  switch( $hero_type ) {
    case '404' :
      $hero = [
        'ja' => __( 'Page not found' ),
        'en' => 'Page not found',
        'img' => file_exists( get_theme_file_path( 'images/back_hero_404.png' ) ) ? get_theme_file_uri( 'images/back_hero_404.png' ) : '',
      ];
      break;
    case 'search' :
      $hero = [
        'ja' => __( 'Search' ),
        'en' => 'Search',
        'img' => file_exists( get_theme_file_path( 'images/back_hero_search.png' ) ) ? get_theme_file_uri( 'images/back_hero_search.png' ) : '',
      ];
      break;
    case 'post-type-archive' :
      $hero = [
        'ja' => $post_type_archive->labels->name,
        'en' => str_replace( [ '-', '_' ], ' ', $post_type_archive->name ),
        'img' => file_exists( get_theme_file_path( 'images/back_hero_post-type-' . $post_type_archive->name . '.png' ) ) ? get_theme_file_uri( 'images/back_hero_post-type-' . $post_type_archive->name . '.png' ) : '',
      ];
      break;
    case 'taxonomy' :
      $hero = [
        'ja' => $term->name,
        'en' => str_replace( [ '-', '_' ], ' ', $term->slug ),
        'img' => file_exists( get_theme_file_path( 'images/back_hero_taxonomy-' . $term->taxonomy . '.png' ) ) ? get_theme_file_uri( 'images/back_hero_taxonomy-' . $term->taxonomy . '.png' ) : '',
      ];
      break;
    case 'singular' :
      /*
      $ancestors = get_ancestors( get_the_ID(), get_post_type() );
      $post_id = !empty( $ancestors ) ? end( $ancestors ) : get_the_ID();
      */
      $post_id = get_the_ID();
      $post = get_post( $post_id );
      $hero = [
        'ja' => get_the_title( $post_id ),
        'en' => str_replace( [ '-', '_' ], ' ', $post->post_name ),
        'img' => has_post_thumbnail( $post_id ) ? wp_get_attachment_image_url( get_post_thumbnail_id( $post_id ), 'full' ) : '',
      ];
      break;
    default :
      break;
  }
  return $hero;
}



/*
 * サブタイトル
 */
function add_subtitle_field( $whitelist_options ) {
  $whitelist_options['general'][] = 'sub_title';
  return $whitelist_options;
}

add_filter( 'allowed_options', 'add_subtitle_field' );

function regist_subtitle_field() {
  add_settings_field( 'sub_title', 'サブタイトル', 'display_sub_title', 'general' );
}

add_action( 'admin_init', 'regist_subtitle_field' );

function display_sub_title() {
  $sub_title = get_option( 'sub_title' );
?>
<input type="text" name="sub_title" value="<?php echo esc_html( $sub_title ); ?>">
<?php
}


/*
 * ページ内リンクボタン自動生成
 */
function get_goto() {
  return '<div class="goto"></div>';
}
add_shortcode( 'goto', 'get_goto' );


/*
 * 絞り込み機能ボタン
 */
function aw_get_category_list( $args = '' ) {
  $defaults = array(
    'post_type' => 'post',
    'taxonomy' => 'category',
    'class' => 'refine__btn',
    'wrapper_class' => '',
  );
  $r = wp_parse_args( $args, $defaults );

  $html = '';
  $classes = array();

  $labels = get_terms( $r['taxonomy'] );
  if( empty( $labels ) )
    return;

  $classes[] = $r['class'];
  $classes[] = $r['class'] . '--all';
  if( is_post_type_archive( $r['post_type'] ) )
    $classes[] = $r['class'] . '--active';
  $html .= '<div class="refine__item">';
  $html .= '<a class="' . implode( ' ', $classes ) . '" href="' . get_post_type_archive_link( $r['post_type'] ) . '">すべて</a>';
  $html .= '</div>';

  foreach( $labels as $label ) {
    $item = '';
    $classes = array();
    $classes[] = $r['class'];
    $classes[] = $r['class'] . '--' . $label->slug;
    if( is_tax( $r['taxonomy'] ) && get_queried_object()->term_id == $label->term_id )
      $classes[] = $r['class'] . '--active';

    $item = '<a class="' . implode( ' ', $classes ) . '" href="' . get_term_link( $label ) . '">' . $label->name . '</a>';
    $html .= '<div class="refine__item">' . $item . '</div>';
  }
  // wrap
  $html = '<div class="' . $r['wrapper_class'] . '">' . $html . '</div>';

  return $html;
}


/*
 * 絞り込み機能セレクトボックス
 */
function aw_get_category_select( $args = '' ) {
  $defaults = array(
    'post_type' => 'post',
    'taxonomy' => 'category',
    'class' => 'refine-select__item',
    'wrapper_class' => 'refine-select'
  );
  $r = wp_parse_args( $args, $defaults );

  $html = '';
  $classes = array();
  $item_classes = array();

  $item_classes[] = '';
  $labels = get_terms( $r['taxonomy'] );
  if( empty( $labels ) )
    return;

  $classes[] = $r['class'];
  $classes[] = $r['class'] . '--all';
  if( is_post_type_archive( $r['post_type'] ) )
    $classes[] = $r['class'] . '--active';

  $html .= '<option class="' . implode( ' ', $classes ) . '" value="">選択してください</option><option class="' . implode( ' ', $classes ) . '" value="' . get_post_type_archive_link( $r['post_type'] ) . '">すべての職種';
  $html .= '</option>';

  foreach( $labels as $label ) {
    $item = '';
    $classes = array();
    $classes[] = $r['class'];
    $classes[] = $r['class'] . '--' . $label->slug;
    if( is_tax( $r['taxonomy'] ) && get_queried_object()->term_id == $label->term_id )
      $classes[] = $r['class'] . '--active';
    $item = $label->name;
    $html .= '<option class="' . implode( ' ', $classes ) . '" value="' . get_term_link( $label ) . '">' . $item . '</option>';
  }
  // wrap
  $html = '<select class="' . $r['wrapper_class'] . '" name="' . $r['wrapper_class'] . '" onchange="top.location.href=value">' . $html . '</select>';
  return $html;
}

/**
 * 郵便番号APIを「MW WP Form」で利用する
 */
function aw_mw_enqueue_scripts() {
  wp_enqueue_script( 'aw-yubinbango', 'https://yubinbango.github.io/yubinbango/yubinbango.js', array(), null, true );
}
// 該当のフォームIDに変えてください
add_action( 'mwform_enqueue_scripts_mw-wp-form-207', 'aw_mw_enqueue_scripts' );
add_action( 'mwform_enqueue_scripts_mw-wp-form-253', 'aw_mw_enqueue_scripts' );
add_action( 'mwform_enqueue_scripts_mw-wp-form-475', 'aw_mw_enqueue_scripts' );

/**
 * 「MW WP Form」バリエーションカスタマイズ
 */

/*

function my_validation_rule( $Validation, $data ) {
//  エラーメッセージ文の変更
   $Validation->set_rule( 'zip', 'noempty', array( 'message' => '郵便番号が未入力です。' ) );
   $Validation->set_rule( 'city', 'noempty', array( 'message' => '住所が未入力です。' ) );

//  選択項目によってテキストボックスを必須にする
  if ( $data['type'] === 'その他' ) {
      $Validation->set_rule( 'type-msg', 'noEmpty', array(
        'message' => 'その他を選択された場合は必ずご記入下さい。'
      ) );
  }
    if ( $data['contents'] === 'その他' ) {
      $Validation->set_rule( 'attend', 'noEmpty', array(
        'message' => 'その他を選択された場合は必ずご記入下さい。'
      ) );
  }
  return $Validation;
}
//「mw-wp-form-xx」のxx部分はフォーム識別子key
add_filter( 'mwform_validation_mw-wp-form-371', 'my_validation_rule', 10, 2 );

 */

/*
 * フォーム生年月日セレクトボックスの年数自動出力
 */
//function add_select_published( $children, $atts ) {
//  // publication_date を該当の name 属性に変更すれば使えます。
//  if ( $atts['name'] === 'year' ) {
//    $now = date( 'Y' );
//    // 過去50年までセレクトボックスにする
//    for( $count = -50; $count <= 0; $count++ ) {
//      $year = ( $now + $count ) . "年";
//      $children[$year] = $year;
//    }
//  }
//  return $children;
//}
//// 該当のフォームIDに変えてください
//add_filter( 'mwform_choices_mw-wp-form-475', 'add_select_published', 10, 2 );


/**
 * fetch_feed() のキャッシュ時間を変更
 */
function aw_feed_cache_transient_lifetime( $seconds ) {
  // キャッシュを10分に変更
  return 60;
}
add_filter( 'wp_feed_cache_transient_lifetime' , 'aw_feed_cache_transient_lifetime' );


function my_tiny_mce_before_init( $init_array ) {
  global $allowedposttags;

  $init_array['valid_elements']          = '*[*]';
  $init_array['extended_valid_elements'] = '*[*]';
  $init_array['valid_children']          = '+a[' . implode( '|', array_keys( $allowedposttags ) ) . ']';
  $init_array['indent']                  = true;
  $init_array['wpautop']                 = true;
  $init_array['forced_root_block']        = false;

  return $init_array;
}
add_filter( 'tiny_mce_before_init' , 'my_tiny_mce_before_init' );


/**
 * パンくずリスト
 */
function get_breadcrumbs() {
  $breadcrumbs = [];
  $terms = [];
  $post_type_archive = null;
  $queried_object = get_queried_object();

  /**
   * 詳細ページを追加
   */
  if( is_singular() ) {
    $post_type_object = get_post_type_object( get_post_type() );
    $ancestors = get_ancestors( get_the_ID(), $post_type_object->name, 'post_type' );
    array_unshift( $ancestors, get_the_ID() );
    foreach( $ancestors as $ancestor ) {
      $breadcrumbs[] = [
        'name' => get_the_title( $ancestor ),
        'item' => get_permalink( $ancestor ),
      ];
    }
    if( $post_type_object->has_archive ) {
      foreach( $post_type_object->taxonomies as $taxonomy_name ) {
        $my_terms = get_the_terms( get_the_ID(), $taxonomy_name );
        if( $my_terms && ! is_wp_error( $my_terms ) ) {
          $terms = array_merge( $terms, $my_terms );
        }
      }
      $post_type_archive = $post_type_object;
    }
  } elseif( is_post_type_archive() ) {
    $post_type_archive = $queried_object;
  } elseif( is_category() || is_tag() || is_tax() ) {
    $terms[] = $queried_object;
  } elseif( is_search() ) {
    $breadcrumbs[] = [
      'name' => sprintf( __( 'Search Results for &#8220;%s&#8221;' ), get_search_query() ),
      'item' => home_url( '/?s=' . get_search_query() ),
    ];
  } else {
  }

  /**
   * ターム名を追加
   */
  if( !empty( $terms ) ) {
    foreach( $terms as $term ) {
      $term_ancestors = get_ancestors( $term->term_id, $term->taxonomy, 'taxonomy' );
      array_unshift( $term_ancestors, $term->term_id );
      foreach( $term_ancestors as $term_ancestor ) {
        $term_object = get_term( $term_ancestor, $term->taxonomy );
        $breadcrumbs[] = [
          'name' => $term_object->name,
          'item' => get_term_link( $term_object ),
        ];
      }
    }
  }

  /**
   * 投稿タイプ名を追加
   */
  if( !empty( $post_type_archive ) ) {
    $breadcrumbs[] =  [
      'name' => $post_type_archive->label,
      'item' => get_post_type_archive_link( $post_type_archive->name ),
    ];
  }

  /**
   * ホームを追加
   */
  if( $breadcrumbs ) {
    $breadcrumbs[] = [
      'name' => 'TOP',
      'item' => home_url( '/' ),
    ];
    $breadcrumbs = array_reverse( $breadcrumbs );
  }

  return $breadcrumbs;
}
