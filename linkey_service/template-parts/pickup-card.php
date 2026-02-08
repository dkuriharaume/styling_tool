<?php
/**
 * ピックアップカード
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/pickup-card',
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
$categories = get_the_terms( $card->ID, 'example_category' );
$company = SCF::get('company_name');

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
    <span class="pickup-card__title"><?php echo get_the_title( $card->ID ); ?></span>
    <span class="pickup-card__name"><?php echo $company; ?></span>

    <div class="pickup-card__ctg-wrap">
        <?php
    if( $categories ) :
      foreach( $categories as $category ) :
        ?>
          <span class="pickup-card__category pickup-card__category--<?php echo $category->slug; ?>"><?php echo $category->name; ?></span>
        <?php
      endforeach;
    endif;
    ?>
    </div>
  </div>
</div>
