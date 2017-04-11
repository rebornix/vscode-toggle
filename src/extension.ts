'use strict';
import * as vscode from 'vscode';

interface Configuration {
    [key: string]: any;
}

class ToggleArguments {
    id: string;
    value: Configuration[];
}

var toggleCache: { [key: string]: number } = {};

function shallowEqual(a: any, b: any): boolean {
    // only check fist depth
    for (let key in a) {
        if (!a.hasOwnProperty(key)) continue;
        if (!b.hasOwnProperty(key)) return false;
        if (a[key] === b[key]) continue;
        if (typeof (a[key]) !== "object") return false;
    }
    for (let key in b) {
        if (b.hasOwnProperty(key) && !a.hasOwnProperty(key)) return false;
    }
    return true;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('toggle', (args: ToggleArguments) => {
        if (!args || !args.id || !args.value) {
            vscode.window.showErrorMessage(`Please make sure your 'args' is not empty`);
            return;
        }

        let workspaceConfiguration = vscode.workspace.getConfiguration();

        let allOptions: Set<string> = new Set<string>();
        args.value.forEach(value => {
            Object.keys(value).forEach(key => {
                allOptions.add(key);
            });
        });

        // if there is workspace setting for any config, we don't allow you to toggle.
        let currentOptions: { [key: string]: any } = {};
        for (let key of allOptions.values()) {
            let val = workspaceConfiguration.inspect(key);
            if (val.workspaceValue !== undefined) {
                vscode.window.showErrorMessage(`We cannot toggle option ${val.key} as it is overriden in current workspace`);
                return;
            }
            currentOptions[val.key] = val.globalValue !== undefined ? val.globalValue : val.defaultValue;
        }

        if (toggleCache[args.id] === undefined) {
            if (args.value.length <= 0) {
                vscode.window.showWarningMessage(`Please make sure your 'args.value' is not empty'`);
                return;
            }

            let currentIndex = -1;

            for (let index = 0, len = args.value.length; index < len; index++) {
                let configuration = args.value[index];
                if (shallowEqual(configuration, currentOptions)) {
                    currentIndex = index;
                }
            }

            let nextIndex = (currentIndex + 1) % args.value.length;
            toggleCache[args.id] = nextIndex;

            Object.keys(args.value[nextIndex]).forEach(key => {
                let val = args.value[nextIndex][key];
                workspaceConfiguration.update(key, val, true);
            });
        } else {
            let nextIndex = (toggleCache[args.id] + 1) % args.value.length;
            toggleCache[args.id] = nextIndex;
            Object.keys(args.value[nextIndex]).forEach(key => {
                let val = args.value[nextIndex][key];
                workspaceConfiguration.update(key, val, true);
            });
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}