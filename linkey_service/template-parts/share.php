<?php
$current_url = aw_get_current_url();
?>
<ul class="share">
  <li class="share__item"><a class="share__link share-icon" href="https://twitter.com/intent/tweet?text=<?php echo urlencode( wp_get_document_title() ); ?>&url=<?php echo urlencode( $current_url ); ?>" target="_blank" rel="noopener">Twitter</a></li>
  <li class="share__item"><a class="share__link share-icon" href="https://www.facebook.com/sharer/sharer.php?u=<?php echo urlencode( $current_url ); ?>" target="_blank" rel="noopener">Facebook</a></li>
  <li class="share__item"><a class="share__link share-icon" href="http://line.me/R/msg/text/?<?php echo wp_get_document_title(); ?> <?php echo urlencode( $current_url ); ?>" target="_blank" rel="noopener">LINE</a></li>
</ul>
