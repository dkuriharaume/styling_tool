<?php
/**
 * 画像パーツ
 *
 * 自動で width/height, loading="lazy" が付与。
 * SVGは対象外です。
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/image',
 *    null,
 *    array(
 *      'src' => images/sample.png,
 *      'class' => 'img-responsive',
 *      'alt' => '代替テキスト',
 *      'attr' => array(
 *        'custom-attribute' => 'custom value',
 *      ),
 *    ),
 * )
 */
$array_defaults = array(
  'src' => '',
  'alt' => '',
  'class' => 'img-responsive',
  'loading' => 'lazy',
  'attr' => array(
    'width' => '',
    'height' => '',
  ),
);
$args = wp_parse_args( $args, $array_defaults );

if( empty( $args['src'] ) )
  return;

if( ! file_exists( get_theme_file_path( $args['src'] ) ) )
  return;

if( ! $size = wp_getimagesize( get_theme_file_path( $args['src'] ) ) )
  return;

$atts = array();
$atts[] = 'class="' . $args['class'] . '"';
$atts[] = 'alt="' . $args['alt'] . '"';
$atts[] = 'loading="' . $args['loading'] . '"';

if( empty( $args['attr']['width'] ) && empty( $args['attr']['height'] ) ) {
  $args['attr']['width'] = $size[0];
  $args['attr']['height'] = $size[1];
}

foreach( $args['attr'] as $attr_key => $attr_val ) {
  $atts[] = $attr_key . '="' . $attr_val . '"';
}
printf(
  '<img src="%s" %s>',
  get_theme_file_uri( $args['src'] ),
  implode( ' ', $atts ),
);
?>
