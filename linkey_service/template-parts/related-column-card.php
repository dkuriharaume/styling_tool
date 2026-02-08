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
$r_author_id = get_post_field('post_author', $post_id);
$r_user_icon = SCF::get_user_meta($r_author_id, 'user_icon');
$r_author_name = get_the_author_meta('display_name', $r_author_id);
?>

        <a class="related-columns-item" href="<?php echo get_permalink($card->ID); ?>">
          <div class="row row--std-sp-ad">

            <!-- 画像側 -->
            <div class="row__item row__item--tablet-4">
              <div class="related-columns-item__thumb">
                <?php echo get_the_post_thumbnail( $card->ID, 'medium' ); ?>
              </div>
            </div>

            <!-- 右側テキスト -->
            <div class="row__item row__item--tablet-8">
              <div class="related-columns-item__body">
                <p class="related-columns-item__meta">
                  <?php echo get_the_date('Y/m/d', $card->ID); ?>
                </p>
                <p class="related-columns-item__title">
                  <?php echo get_the_title($card->ID); ?>
                </p>
                <p class="related-columns-item__excerpt">
                  <?php
                    $content = get_post_field('post_content', $card->ID);
                    $content = strip_tags($content);
                    $content = preg_replace('/\s+/', ' ', $content);
                    echo esc_html(mb_substr($content, 0, 150));
                  ?>
                </p>
                <p class="related-columns-item__author">
                  <?php if ($r_user_icon) : ?>
                    <img class="related-columns-item__icon"
                        src="<?php echo wp_get_attachment_url($r_user_icon); ?>"
                        alt="<?php echo esc_attr($r_author_name); ?>">
                  <?php endif; ?>
                  <strong class="related-columns-item__author-name">
                    <?php echo esc_html($r_author_name); ?>
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </a>
