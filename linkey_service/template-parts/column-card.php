<?php
/**
 * ニュースカード
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/column-card',
 *    null,
 *    array(
 *      'class' => '',
 *      'post_id' => 0,
 *    ),
 * )
 *
 */

$args = wp_parse_args(
  $args,
  array(
    'class' => '',
    'post_id' => 0,
  )
);
$card = get_post( $args['post_id'] );
$column_categories = get_the_terms( $card->ID, 'column_category' );

if( has_excerpt( $card->ID ) ) {
  $excerpt = get_the_excerpt( $card->ID );
} else {
  $excerpt = wp_trim_excerpt( '', $card );
}
?>

<div class="pickup-card<?php echo !empty( $args['class'] ) ? ' ' . $args['class'] : ''; ?>">
  <a href="<?php echo get_permalink( $card->ID ); ?>" class="pickup-card__link" title="<?php echo get_the_title( $card->ID ); ?>"></a>
  <div class="pickup-card__thumbnail"><?php echo get_the_post_thumbnail( $card->ID, 'thumbnail', array( 'class' => 'pickup-card__img' ) ); ?></div>
  <div class="pickup-card__box">
    <time class="pickup-card__time" datetime="<?php echo get_post_time( 'Y-m-d' ) ?>"><?php echo get_post_time( 'Y.m.d' ) ?></time>
    <span class="pickup-card__title pickup-card__title--column"><?php echo get_the_title( $card->ID ); ?></span>

    <div class="pickup-card__ctg-wrap">
        <?php
    if( $column_categories ) :
      foreach( $column_categories as $column_category ) :
        ?>
          <span class="pickup-card__category pickup-card__category--<?php echo $column_category->slug; ?>"><?php echo $column_category->name; ?></span>
        <?php
      endforeach;
    endif;
    ?>
    </div>
  </div>
</div>

