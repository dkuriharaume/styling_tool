<?php
/*
 * カスタマイザーの登録
 */
function aw_organization_customize_register( $wp_customize ) {
  $wp_customize->add_section(
    'aw_template_organization',
    array(
      'title' => '組織情報',
      'priority' => 202,
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[name]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_name',
    array(
      'settings' => 'aw_template_organization[name]',
      'label' => '名称',
      'section' => 'aw_template_organization',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[postal]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_postal',
    array(
      'settings' => 'aw_template_organization[postal]',
      'label' => 'postalCode（郵便番号）',
      'section' => 'aw_template_organization',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[region]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_region',
    array(
      'settings' => 'aw_template_organization[region]',
      'label' => 'addressRegion（都道府県）',
      'section' => 'aw_template_organization',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[locality]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_locality',
    array(
      'settings' => 'aw_template_organization[locality]',
      'label' => 'addressLocality（市区町村）',
      'section' => 'aw_template_organization',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[street]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_street',
    array(
      'settings' => 'aw_template_organization[street]',
      'label' => 'streetAddress（番地）',
      'section' => 'aw_template_organization',
      'type' => 'text',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[telephone]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_telephone',
    array(
      'settings' => 'aw_template_organization[telephone]',
      'label' => 'telephone（電話）',
      'section' => 'aw_template_organization',
      'type' => 'tel',
    )
  );
  $wp_customize->add_setting(
    'aw_template_organization[fax]',
    array(
      'dafault' => '',
      'transport' => 'postMessage',
    )
  );
  $wp_customize->add_control(
    'aw_template_organization_fax',
    array(
      'settings' => 'aw_template_organization[fax]',
      'label' => 'faxNumber（FAX）',
      'section' => 'aw_template_organization',
      'type' => 'tel',
    )
  );

}
add_action( 'customize_register', 'aw_organization_customize_register' );
