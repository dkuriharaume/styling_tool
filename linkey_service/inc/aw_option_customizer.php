<?php
/*
 * カスタマイザーの登録
 */
function aw_option_customize_register( $wp_customize ) {
  $wp_customize->add_section(
    'aw_template_option',
    array(
      'title' => 'オプション',
      'priority' => 210,
    )
  );
  $wp_customize->add_setting(
    'aw_template_option[analytics_id]',
    array(
      'transport'         => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_option_analytics_id',
    array(
      'settings' => 'aw_template_option[analytics_id]',
      'label' => 'アナリティクス トラッキングID',
      'section' => 'aw_template_option',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_option[dummy_image]',
    array(
      'dafault' => '',
      // 'transport'         => 'refresh',
      'transport'         => 'postMessage',
      'sanitize_callback' => 'sanitize_dummy_image',
    )
  );
  $wp_customize->add_control(
    new WP_Customize_Image_Control(
      $wp_customize,
      'dummy_image_control',
      array(
        'label' => '代替画像',
        'section' => 'aw_template_option',
        'settings' => 'aw_template_option[dummy_image]',
      )
    )
  );
  function sanitize_dummy_image($input) {
    return attachment_url_to_postid($input);
  }
  // テーマカラー
  $wp_customize->add_setting(
    'aw_theme_color',
    array(
      'default' => '#ffffff',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    new WP_Customize_Color_Control(
      $wp_customize,
      'aw_theme_color',
      array(
        'settings' => 'aw_theme_color',
        'label' => 'テーマカラー',
        'section' => 'title_tagline',
      )
    )
  );
}
add_action( 'customize_register', 'aw_option_customize_register' );


/*
 * サイトアイコンにテーマカラーを挿入
 */
function aw_site_icon_meta_tags( $meta_tags ) {
  $meta_tags[] = '<meta name="msapplication-TileColor" content="' . get_theme_mod( 'aw_theme_color' ) . '">';
  $meta_tags[] = '<meta name="theme-color" content="' . get_theme_mod( 'aw_theme_color' ) . '">';
  return $meta_tags;
}
add_filter( 'site_icon_meta_tags', 'aw_site_icon_meta_tags' );

/*
 * CSS変数にテーマカラーを挿入
 */
function aw_set_theme_color() {
  $main_color = get_theme_mod( 'aw_theme_color', '#fff' );
  $style = <<< EOM
:root {
  --main-color: {$main_color};
}
EOM;
  wp_register_style( 'aw-theme', false );
  wp_enqueue_style( 'aw-theme' );
  wp_add_inline_style( 'aw-theme', $style );
}
add_action( 'wp_enqueue_scripts', 'aw_set_theme_color' );


/*
 * ヘッダーにトラッキングタグを挿入
 */
function aw_analytics_tracking() {
  // アナリティクス トラッキング ID を取得
  $options = get_theme_mod( 'aw_template_option' );
  $analytics_id = !empty( $options[ 'analytics_id' ] ) ? $options[ 'analytics_id' ] : '';
  if( !empty( $analytics_id ) ) {
    echo <<< EOM
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=$analytics_id"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '$analytics_id');
</script>

EOM;
  }
}
add_action( 'wp_head', 'aw_analytics_tracking', 0 );




/*
 * アイキャッチが未設定の場合は代替画像を表示
 */
add_filter( 'post_thumbnail_html', 'aw_dummy_thumbnail', 99, 5 );
function aw_dummy_thumbnail( $html, $post_id, $post_thumbnail_id, $size, $attr ) {
  if( !$html ) {
    $options = get_theme_mod( 'aw_template_option' );
    $dummy_id = isset( $options[ 'dummy_image' ] ) ? $options[ 'dummy_image' ] : '';
    if( !empty( $dummy_id ) )
      $html = wp_get_attachment_image( $dummy_id, $size, false, $attr );
  }
  return $html;
}
function aw_dummy_thumbnail_src( $image, $attachment_id, $size, $icon ) {
  if( !$image ) {
    remove_filter( 'wp_get_attachment_image_src', 'aw_dummy_thumbnail_src' );
    $options = get_theme_mod( 'aw_template_option' );
    $dummy_id = $options[ 'dummy_image' ];
    if( !empty( $dummy_id ) )
      $image = wp_get_attachment_image_src( $dummy_id, $size, $icon );
    add_filter( 'wp_get_attachment_image_src', 'aw_dummy_thumbnail_src', 99, 5 );
  }
  return $image;
}
add_filter( 'wp_get_attachment_image_src', 'aw_dummy_thumbnail_src', 99, 5 );