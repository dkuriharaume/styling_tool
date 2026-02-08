<?php
/**
 * ガイド？カード
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/guide-card',
 *    null,
 *    array(
 *      'post_id' => 0,
 *    ),
 * )
 *
 */

$args = wp_parse_args(
  $args,
  array(
    'post_id' => 0,
  )
);
$card = get_post( $args['post_id'] );
if( has_excerpt( $card->ID ) ) {
  $excerpt = get_the_excerpt( $card->ID );
} else {
  $excerpt = wp_trim_excerpt( '', $card );
}
?>
<div class="guide-card guide-card--horizontal">
  <a href="<?php echo get_permalink( $card->ID ); ?>" class="guide-card__link" title="<?php echo get_the_title( $card->ID ); ?>"></a>
  <div class="guide-card__thumbnail"><?php echo get_the_post_thumbnail( $card->ID, 'thumbnail', array( 'class' => 'guide-card__img' ) ); ?></div>
  <div class="guide-card__box">
    <span class="guide-card__title"><?php echo get_the_title( $card->ID ); ?></span>
    <span class="guide-card__description"><?php echo $excerpt; ?></span>
    <div class="guide-card__btn"><span class="guide-card__more">詳細へ</span></div>
  </div>
</div>
