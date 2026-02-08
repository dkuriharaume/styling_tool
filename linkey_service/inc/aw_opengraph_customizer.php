<?php
/*
 * カスタマイザーの登録
 */
function aw_opengraph_customize_register( $wp_customize ) {
  $wp_customize->add_section(
    'aw_template_sns',
    array(
      'title' => 'Open Graph',
      'priority' => 200,
    )
  );
  $wp_customize->add_setting(
    'aw_template_sns[twitter_name]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_sns_twitter_name',
    array(
      'settings' => 'aw_template_sns[twitter_name]',
      'label' => 'Twitter アカウント',
      'section' => 'aw_template_sns',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_sns[twitter_card]',
    array(
      'default' => 'none',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_sns_twitter_card',
    array(
      'settings' => 'aw_template_sns[twitter_card]',
      'label' => 'Twitter カード',
      'section' => 'aw_template_sns',
      'type' => 'select',
      'choices' => array(
        'none' => 'none',
        'summary' => 'summary',
        'summary_large_image' => 'summary_large_image',
      )
    )
  );
  $wp_customize->add_setting(
    'aw_template_sns[ogp_image]',
    array(
      'default' => '',
      'transport' => 'postMessage',
      'sanitize_callback' => 'sanitize_ogp_image',
    )
  );
  $wp_customize->add_control(
    new WP_Customize_Image_Control(
      $wp_customize,
      'ogp_image_control',
      array(
        'label' => 'OGP画像',
        'section' => 'aw_template_sns',
        'settings' => 'aw_template_sns[ogp_image]',
      )
    )
  );
  function sanitize_ogp_image($input) {
    return attachment_url_to_postid($input);
  }

}
add_action( 'customize_register', 'aw_opengraph_customize_register' );

/*
 * OGPタグ
 */
function aw_the_ogp_tags() {
  $q_obj = get_queried_object();
  $title = wp_get_document_title();
  $site_name = get_bloginfo( 'name' );
  $type = '';
  $url = '';
  $image = '';
  $description = '';
  $theme_mod_sns = get_theme_mod( 'aw_template_sns' );

  if( is_singular() ) {
    $type = 'article';
    $url = get_permalink();
    if( has_excerpt() ) $description = get_the_excerpt();
    if( has_post_thumbnail() ) {
      $image = get_the_post_thumbnail_url( get_the_ID(), 'full' );
    } else {
      $image = !empty( $theme_mod_sns[ 'ogp_image' ] ) ? wp_get_attachment_url( $theme_mod_sns[ 'ogp_image' ] ) : '';
    }
  } elseif( is_post_type_archive() ) {
    $type = 'website';
    $url = get_post_type_archive_link( $q_obj->name );
    $q_obj = get_queried_object();
    $description = str_replace("\n", "", $q_obj->description );
    $image = !empty( $theme_mod_sns[ 'ogp_image' ] ) ? wp_get_attachment_url( $theme_mod_sns[ 'ogp_image' ] ) : '';
  } elseif( is_tax() ) {
    $type = 'website';
    $url = get_term_link( $q_obj->slug, $q_obj->taxonomy );
    $q_obj = get_queried_object();
    $description = str_replace("\n", "", $q_obj->description );
    $image = !empty( $theme_mod_sns[ 'ogp_image' ] ) ? wp_get_attachment_url( $theme_mod_sns[ 'ogp_image' ] ) : '';
  } elseif( is_home() || is_front_page() ) {
    $type = 'website';
    $url = home_url();
    $description = get_bloginfo( 'description' );
    $image = !empty( $theme_mod_sns[ 'ogp_image' ] ) ? wp_get_attachment_url( $theme_mod_sns[ 'ogp_image' ] ) : '';
  } else {
  }

  $facebook_ogp  = '<meta property="og:type" content="' . $type . '">' . "\n";
  $facebook_ogp .= '<meta property="og:url" content="' . $url . '">' . "\n";
  $facebook_ogp .= '<meta property="og:site_name" content="' . $site_name . '">' . "\n";
  $facebook_ogp .= '<meta property="og:title" content="' . $title . '">' . "\n";
  $facebook_ogp .= '<meta property="og:description" content="' . $description . '">' . "\n";
  $facebook_ogp .= '<meta property="og:image" content="' . $image . '">' . "\n";
  $facebook_ogp .= '<meta property="og:locale" content="ja_JP">' . "\n";
  $facebook_ogp .= '<meta property="fb:app_id" content="">' . "\n";
  echo $facebook_ogp;

  $twitter_card = '';
  if( !empty( $theme_mod_sns[ 'twitter_card' ] ) && $theme_mod_sns[ 'twitter_card' ] != 'none' ) {
    $twitter_card = '<meta name="twitter:card" content="' . $theme_mod_sns[ 'twitter_card' ] . '">' . "\n";
  }
  if( !empty( $theme_mod_sns[ 'twitter_name' ] ) ) {
    $twitter_card .= '<meta name="twitter:site" content="@' . $theme_mod_sns[ 'twitter_name' ] . '">' . "\n";
    $twitter_card .= '<meta name="twitter:creator" content="@' . $theme_mod_sns[ 'twitter_name' ] . '">' . "\n";
  }
  echo $twitter_card;
}

/*
 * ヘッダーにOGPタグを挿入
 */
add_action( 'wp_head', function() {
  aw_the_ogp_tags();
}, 5 );