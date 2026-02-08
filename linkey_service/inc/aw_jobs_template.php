<?php
/**
 * 募集要項の投稿タイプを追加
 */
function cptui_register_my_cpts_jobs() {
    $labels = [
        "name" => __( "募集要項", "developer_base" ),
        "singular_name" => __( "募集要項", "developer_base" ),
    ];

    $args = [
        "label" => __( "募集要項", "developer_base" ),
        "labels" => $labels,
        "description" => "",
        "public" => true,
        "publicly_queryable" => true,
        "show_ui" => true,
        "delete_with_user" => false,
        "show_in_rest" => true,
        "rest_base" => "",
        "rest_controller_class" => "WP_REST_Posts_Controller",
        "has_archive" => true,
        "show_in_menu" => true,
        "show_in_nav_menus" => true,
        "delete_with_user" => false,
        "exclude_from_search" => false,
        "capability_type" => "post",
        "map_meta_cap" => true,
        "hierarchical" => false,
        "rewrite" => [ "slug" => "jobs", "with_front" => true ],
        "query_var" => true,
        "supports" => [ "title", "editor", "thumbnail", "excerpt" ],
    ];

    register_post_type( "jobs", $args );
}

add_action( 'init', 'cptui_register_my_cpts_jobs' );


/**
 * 募集要項のタクソノミーを追加
 */
function cptui_register_my_taxes_place_category() {

    /**
     * Taxonomy: 勤務先カテゴリー.
     */

    $labels = [
        "name" => __( "勤務先カテゴリー", "developer_base" ),
        "singular_name" => __( "勤務先カテゴリー", "developer_base" ),
    ];

    $args = [
        "label" => __( "勤務先カテゴリー", "developer_base" ),
        "labels" => $labels,
        "public" => true,
        "publicly_queryable" => true,
        "hierarchical" => true,
        "show_ui" => true,
        "show_in_menu" => true,
        "show_in_nav_menus" => true,
        "query_var" => true,
        "rewrite" => [ 'slug' => 'place_category', 'with_front' => true, ],
        "show_admin_column" => true,
        "show_in_rest" => true,
        "rest_base" => "place_category",
        "rest_controller_class" => "WP_REST_Terms_Controller",
        "show_in_quick_edit" => false,
        ];
    register_taxonomy( "place_category", [ "jobs" ], $args );
}
add_action( 'init', 'cptui_register_my_taxes_place_category' );

function cptui_register_my_taxes_job_category() {

    /**
     * Taxonomy: 職種カテゴリー.
     */

    $labels = [
        "name" => __( "職種カテゴリー", "developer_base" ),
        "singular_name" => __( "職種カテゴリー", "developer_base" ),
    ];

    $args = [
        "label" => __( "職種カテゴリー", "developer_base" ),
        "labels" => $labels,
        "public" => true,
        "publicly_queryable" => true,
        "hierarchical" => true,
        "show_ui" => true,
        "show_in_menu" => true,
        "show_in_nav_menus" => true,
        "query_var" => true,
        "rewrite" => [ 'slug' => 'job_category', 'with_front' => true, ],
        "show_admin_column" => true,
        "show_in_rest" => true,
        "rest_base" => "job_category",
        "rest_controller_class" => "WP_REST_Terms_Controller",
        "show_in_quick_edit" => false,
        ];
    register_taxonomy( "job_category", [ "jobs" ], $args );
}
add_action( 'init', 'cptui_register_my_taxes_job_category' );


function cptui_register_my_taxes_status_category() {

    /**
     * Taxonomy: 雇用形態カテゴリー.
     */

    $labels = [
        "name" => __( "雇用形態カテゴリー", "developer_base" ),
        "singular_name" => __( "雇用形態カテゴリー", "developer_base" ),
    ];

    $args = [
        "label" => __( "雇用形態カテゴリー", "developer_base" ),
        "labels" => $labels,
        "public" => true,
        "publicly_queryable" => true,
        "hierarchical" => true,
        "show_ui" => true,
        "show_in_menu" => true,
        "show_in_nav_menus" => true,
        "query_var" => true,
        "rewrite" => [ 'slug' => 'status_category', 'with_front' => true, ],
        "show_admin_column" => true,
        "show_in_rest" => true,
        "rest_base" => "status_category",
        "rest_controller_class" => "WP_REST_Terms_Controller",
        "show_in_quick_edit" => false,
        ];
    register_taxonomy( "status_category", [ "jobs" ], $args );
}
add_action( 'init', 'cptui_register_my_taxes_status_category' );

/**
 * 募集要項のカスタムフィールドを追加
 */
function aw_register_fields( $settings, $post_type, $post, $meta_type ) {
  // 募集要項SCF
  if( $post_type == 'jobs' ) {
    $setting = SCF::add_setting( 'jobs_field', '募集要項' );
    $setting->add_group( 'jobs_field_group', false, array(
      array(
        'name' => 'jobs_content',
        'label' => '業務内容',
        'type' => 'textarea',
        'rows' => 15,
      ),
      array(
        'name' => 'jobs_qualification',
        'label' => '応募資格',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_statue',
        'label' => 'こんな人と働きたい',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_melit',
        'label' => 'こんなメリットがあります',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_salary',
        'label' => '給与',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_salaryincrease',
        'label' => '昇給',
        'type' => 'text',
      ),
      array(
        'name' => 'jobs_bonus',
        'label' => '賞与',
        'type' => 'text',
      ),
      array(
        'name' => 'jobs_time',
        'label' => '勤務時間',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_holiday',
        'label' => '休日・休暇',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_welfare',
        'label' => '福利厚生',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_other',
        'label' => 'その他',
        'type' => 'textarea',
        'rows' => 10,
      ),
      array(
        'name' => 'jobs_company',
        'label' => '会社名',
        'type' => 'text',
      ),
      array(
        'name' => 'jobs_place',
        'label' => '勤務地',
        'type' => 'textarea',
        'rows' => 5,
      ),
    ) );
    $settings[] = $setting;
  }
  return $settings;
}
function aw_init_custom_fields() {
  SCF::add_options_page( 'オプション', 'オプション', 'manage_options', 'aw_custom_option' );
  
  add_filter( 'smart-cf-register-fields', 'aw_register_fields', 10, 4 );
}

if( class_exists( 'SCF' ) ) {
  aw_init_custom_fields();
}

/**
 * 職種・雇用形態・希望勤務地をエントリーフォームで出力
 */
function add_textbox_job( $value, $name ) {
  if ( $name === 'job' ) {
    $get_id = $_GET["post_id"];
    $categories = get_the_terms( $get_id, 'job_category' );
    if( $categories ) {
      foreach( $categories as $category ) {
        $value = $category->name;
        break;
      }
    }
  }
  if ( $name === 'status' ) {
    $get_id = $_GET["post_id"];
    $categories = get_the_terms( $get_id, 'status_category' );
    if( $categories ) {
      foreach( $categories as $category ) {
        $value = $category->name;
        break;
      }
    }
  }
  if ( $name === 'place' ) {
    $get_id = $_GET["post_id"];
    $categories = get_the_terms( $get_id, 'place_category' );
    if( $categories ) {
      foreach( $categories as $category ) {
        $value = $category->name;
        break;
      }
    }
  }
  return $value;
}
add_filter( 'mwform_value_mw-wp-form-475', 'add_textbox_job', 10, 2 );
?>