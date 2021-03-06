---
Added: v2.0.0
Status: Active
---
# Start Task Component

Creates/Starts new task for the specified app

![adf-start-task](../docassets/images/adf-start-task.png)

## Basic Usage

```html
<adf-start-task
    [appId]="YOUR_APP_ID">
</adf-start-task>
```

### Properties

| Name | Type | Default value | Description |
| ---- | ---- | ------------- | ----------- |
| appId | `number` |  | (required) The id of the app.  |

### Events

| Name | Type | Description |
| ---- | ---- | ----------- |
| success | `EventEmitter<any>` | Emitted when the task is successfully created. |
| cancel | `EventEmitter<void>` | Emitted when the cancel button is clicked by the user. |
| error | `EventEmitter<any>` | Emitted when an error occurs. |
