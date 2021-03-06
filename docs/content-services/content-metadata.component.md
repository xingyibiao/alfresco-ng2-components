---
Added: v2.1.0
Status: Active
Last reviewed: 2018-04-16
---

# Content Metadata Card component

Displays and edits metadata related to a node.

![Content metadata screenshot](../docassets/images/ContentMetadata.png)

## Basic Usage

```html
<adf-content-metadata-card
    [displayEmpty]="false"
    [preset]="'*'"
    [node]="node">
</adf-content-metadata-card>
```

## Class members

### Properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| node | MinimalNodeEntryEntity | - | (**required**) The node entity to fetch metadata about |
| displayEmpty | boolean | false | Toggles whether to display empty values in the card view |
| readOnly | boolean | true | Toggles whether the edit button should be shown |
| multi | boolean | false | The multi parameter of the underlying material expansion panel |
| preset | string | "*" | Name of the metadata preset, which defines aspects and their properties |

## Details

The component shows metadata related to a given node. It uses the
[Card View component](../core/card-view.component.md) to render the properties of metadata aspects.
The different aspects and their properties to be shown can be configured as application config
presets (see below). By default the component only shows the basic properties of the node.
The user can click on the pencil icon at the bottom of the component to edit the metadata
properties.

### Application config presets

You can define different presets for the metadata component or override the default presets in
the `app.config.json` file. The **default** preset is "*" if not set, meaning the component
will display every aspect and property of a node without filtering. 

You can define as many extra presets as you need for your components.

The example configurations below show the options in detail.

#### Indifferent config

The default configuration behaves like the following:

```json
...
"content-metadata": {
    "presets": {
        "default": "*"
    }
}
...
```

#### Aspect oriented config

With this type of configuration you can "whitelist" aspects and properties for a preset, but everything will be grouped by aspects and there is no further way to group properties. Use a
[layout oriented configuration](#layout-oriented-config) if you want to define your own
custom groups.

The default configuration shows every aspect but you can restrict it to just a small selection
of aspects by "whitelisting" the ones you want in the `default` section. In the example below,
just the `exif:exif` and `custom:aspect` aspects are whitelisted:

```json
...
"content-metadata": {
    "presets": {
        "default": {
            "custom:aspect": "*",
            "exif:exif": "*"
        }
    }
}
...
```

You can further restrict the whitelist to specific properties of one or more aspects by using
an array of property names in place of the "*" filter:

```json
...
"content-metadata": {
    "presets": {
        "default": {
            "custom:aspect": "*",
            "exif:exif": [ "exif:pixelXDimension", "exif:pixelYDimension"]
        }
    }
}
...
```

A final example shows the same process applied to a custom preset called "kitten-images":

```json
...
"content-metadata": {
    "presets": {
        "default": "*",
        "kitten-images": {
            "custom:aspect": "*",
            "exif:exif": [ "exif:pixelXDimension", "exif:pixelYDimension"]
        }
    }
}
...
```

### Layout oriented config

You can also go beyond the aspect oriented configuration if you need to configure the groups and properties in a more detailed way. With this type of configuration any property of any aspect/type
can be "cherry picked" and grouped into an accordion drawer, along wwith a translatable title
defined in the preset configuration.

#### Basic elements

The following config will produce one accordion group named "TRANSLATABLE_TITLE_FOR_GROUP_1",
with all the properties from `custom:aspect` followed by the two properties (`exif:pixelXDimension`
and `exif:pixelYDimension`) from the `exif:exif` aspect and then one property (`custom:myPropertyName`) from `custom:type`:

```json
...
"content-metadata": {
    "presets": {
        "kitten-images": [{
            "title": "TRANSLATABLE_TITLE_FOR_GROUP_1",
            "items": [
                { "aspect": "custom:aspect", "properties": "*" },
                { "aspect": "exif:exif", "properties": [ "exif:pixelXDimension", "exif:pixelYDimension"] },
                { "type": "custom:type", "properties": [ "custom:myPropertyName" ] },
            ] 
        }]
    }
}
...
```

#### More complex example

A more complex config is shown in the example below:

```json
  "content-metadata": {
    "presets": {
      "kittens": [
      {
        "title": "GROUP-TITLE1-TRANSLATION-KEY",
        "items": [
          { 
            "aspect": "exif:exif",
            "properties": "*"
          },
          { 
            "aspect": "kitten:vet-records", 
            "properties": [ "kitten:custom1", "kitten:custom3" ]
          },
          { 
            "aspect": "owner:parameters", 
            "properties": [ "owner:name" ]
          },
          { 
            "type": "kitten:kitten", 
            "properties": [ "kitten:name", "kitten:color" ]
          }
        ]
      },
      {
        "title": "GROUP-TITLE2-TRANSLATION-KEY",
        "items": [
          {
            "aspect": "kitten:food", 
            "properties": [ "kitten:favourite-food", "kitten:recommended-food" ] 
          }
        ]
      }
    ]
  }
```
The result of this config would be two accordion groups with the following properties:

|GROUP-TITLE1-TRANSLATION-KEY|
|---|
|exif:param1|
|exif:param2|
|...|
|exif:paramN|
|kitten:custom1|
|kitten:custom3|
|owner:name|
|kitten:name|
|kitten:color|

|GROUP-TITLE2-TRANSLATION-KEY|
|---|
|kitten:favourite-food|
|kitten:recommended-food|

## What happens when there is a whitelisted aspect in the config but the given node doesn't relate to that aspect

Nothing - since this aspect is not related to the node, it will simply be ignored and not
displayed. The aspects to be displayed are calculated as an intersection of the preset's aspects and the aspects related to the node.
