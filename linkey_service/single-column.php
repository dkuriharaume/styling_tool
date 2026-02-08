<?php get_header(); ?>

<?php
$hero = get_hero();

if (have_posts()) :
  while (have_posts()) : the_post();
      $column_categories = get_the_terms(get_the_ID(), 'column_category');
      $thumbnail_id = get_post_thumbnail_id();
      $thumbnail_img = wp_get_attachment_image_src($thumbnail_id, 'full');
?>

<main class="main main--page">
  <article class="page-article">
    <!-- HERO -->
    <?php get_template_part('template-parts/hero', null); ?>

    <div class="container">
      <div class="post-type-page post-type-page--column">
        <div class="column-head">
          <time class="column-head__time"><?php echo get_post_time('Y/m/d'); ?></time>
          <span class="column-head__update">更新日：<?php echo get_the_modified_time('Y/m/d'); ?></span>
          <h2 class="column-title"><?php the_title(); ?></h2>
          <div class="witer-name">Written by<span><?php the_author(); ?></span></div>
        </div>

        <?php the_content(); ?>


        <!-- 著者プロフィール -->
        <?php
        $author_id = get_the_author_meta('ID');
        $user_icon = SCF::get_user_meta($author_id, 'user_icon');
        $author_display_name = get_the_author_meta('display_name', $author_id);
        $author_description = get_the_author_meta('description', $author_id);
        ?>

        <div class="column-author-box">
          <div class="row row--min">
            <div class="row__item row__item--tablet-2">
              <?php if ($user_icon) : ?>
                <img src="<?php echo wp_get_attachment_url($user_icon); ?>" alt="<?php echo esc_attr($author_display_name); ?>">
              <?php endif; ?>
            </div>
            <div class="row__item row__item--tablet-10">
              <div class="column-author-box__body">
                <h4 class="h4">この記事の著者</h4>
                <strong class="strong"><?php echo esc_html($author_display_name); ?></strong>
                <?php if ($author_description) : ?>
                  <p><?php echo nl2br(esc_html($author_description)); ?></p>
                <?php endif; ?>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- 関連記事 -->
        <?php
        $related_posts = SCF::get('related_post');

        if (!empty($related_posts)) :
            $post_ids = is_array($related_posts) ? $related_posts : array($related_posts);
        ?>
        <h3 class="h3">関連記事はこちらからご覧ください</h3>
          <?php foreach ($post_ids as $post_id) :
              if (!$post_id || get_post_status($post_id) !== 'publish') continue;

              $thumb = get_the_post_thumbnail($post_id, 'medium');
              $date = get_the_date('Y/m/d', $post_id);
              $title = get_the_title($post_id);
              $content = get_post_field('post_content', $post_id);
              $content = wp_strip_all_tags($content);
              $excerpt = mb_substr($content, 0, 140) . '…';

              $r_author_id = get_post_field('post_author', $post_id);
              $r_user_icon = SCF::get_user_meta($r_author_id, 'user_icon');
              $r_author_name = get_the_author_meta('display_name', $r_author_id);
          ?>
        <a class="related-columns-item" href="<?php echo get_permalink($post_id); ?>">
          <div class="row row--std-sp-ad">

            <!-- 画像側 -->
            <div class="row__item row__item--tablet-4">
              <div class="related-columns-item__thumb">
                <?php echo $thumb; ?>
              </div>
            </div>

            <!-- 右側テキスト -->
            <div class="row__item row__item--tablet-8">
              <div class="related-columns-item__body">
                <p class="related-columns-item__meta">
                  <?php echo $date; ?>
                </p>
                <p class="related-columns-item__title">
                  <?php echo esc_html($title); ?>
                </p>
                <p class="related-columns-item__excerpt">
                  <?php echo esc_html($excerpt); ?>
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
        <?php endforeach; ?>
        <?php endif; ?>
        <?php echo get_custom_single_pager(); ?>

    </div>
  </article>
</main>

<?php
  endwhile;
endif;
?>

<?php get_footer(); ?>
