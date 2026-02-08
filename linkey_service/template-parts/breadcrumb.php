
<?php
/**
 * パンくずリスト
 */
$breadcrumbs = get_breadcrumbs();
if( !empty( $breadcrumbs ) ) {
  $bc_count = 0;
?>
<div class="container container--wide">
  <div class="breadcrumb">
    <ul class="breadcrumb__list" itemscope itemtype="https://schema.org/BreadcrumbList">
      <?php foreach( $breadcrumbs as $breadcrumb ) {
        $bc_count = $bc_count + 1;
        ?>
        <li class="breadcrumb__item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a class="breadcrumb__link" itemprop="item" href="<?php echo $breadcrumb['item']; ?>">
            <span itemprop="name"><?php echo $breadcrumb['name']; ?></span>
          </a>
          <meta itemprop="position" content="<?php echo $bc_count; ?>" />
        </li>
        <?php
      } ?>
    </ul>
  </div>
</div>
<?php
}
?>
