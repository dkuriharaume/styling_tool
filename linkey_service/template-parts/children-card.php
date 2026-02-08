<?php
/**
 * 子ページカード
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/children-card',
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
<article class="children-card">
  <a class="link-fit" href="<?php echo get_permalink( $card->ID ); ?>" title="<?php echo get_the_title( $card->ID ); ?>"></a>
  <div class="children-card__image">
    <?php echo get_the_post_thumbnail( $card->ID, 'thumbnail', array( 'class' => 'img-responsive children-card__thumbnail' ) ); ?>
  </div>
  <span class="children-card__title"><?php echo get_the_title( $card->ID ); ?></span>
  <span class="children-card__description"><?php echo $excerpt; ?></span>
  <span class="children-card__more">See more</span>
</article>