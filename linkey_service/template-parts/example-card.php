<?php
/**
 * ニュースカード
 *
 * 使い方 :
 * get_template_part(
 *    'template-parts/example-card',
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

?>


<article class="example-card<?php echo !empty( $args['class'] ) ? ' ' . $args['class'] : ''; ?>">
  <time class="example-card__time" datetime="<?php echo get_post_time( 'Y-m-d' ) ?>"><?php echo get_post_time( 'Y.m.d' ) ?></time>
<?php
if( $categories ) :
  foreach( $categories as $category ) :
    ?>
      <span class="example-card__category example-card__category--<?php echo $category->slug; ?>"><?php echo $category->name; ?></span>
    <?php
  endforeach;
endif;
?>
  <h2 class="example-card__post-title"><?php echo get_the_title( $card->ID ); ?></h2>
  <!-- 文字数制限の場合は wp_trim_words( get_the_title(),25, '...' ) -->
   <a class="example-card__link" href="<?php echo get_permalink( $card->ID ); ?>"></a>
</article>
