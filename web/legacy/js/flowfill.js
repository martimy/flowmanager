// Copyright (c) 2018 Maen Artimy
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


function FlowFill(addRaw) {
    function fillMatch(mfields) {
        var numrows = $("#matchtable tr").length - 1;
        var required = Object.keys(mfields).length;

        while (required > numrows) {
            addRaw($("#matchtable"));
            numrows = $("#matchtable tr").length - 1;
        }

        var $onerow = $("#matchtable tr");
        var idx = 1;
        $.each(mfields, function(field, value) {
            $onerow.eq(idx).find("[name=matchfield]").val(field);
            $onerow.eq(idx).find("[name=matchvalue]").val(value);
            $onerow.eq(idx).find("[name=bmatch]").val('-');
            idx++;
        });
        $onerow.eq(idx-1).find("[name=bmatch]").val('+');
    };

    function fillWriteActions(mfields) {
        var numrows = $("#writetable tr").length - 1;
        var required = Object.keys(mfields).length;

        while (required > numrows) {
            addRaw($("#writetable"));
            numrows = $("#writetable tr").length - 1;
        }

        var $onerow = $("#writetable tr");
        var idx = 1;
        $.each(mfields, function(index, action) {
            var sep = action.indexOf(":");
            console.log(sep)
            var cmd = '';
            var act = '';
            if( sep >= 0) {
                cmd = action.substring(0, sep);
                act = action.substring(sep + 1);
            } else {
                cmd = action;
            }
            
            act=act.replace(" {","").replace("}","").replace(":","=");

            $onerow.eq(idx).find("[name=writeaction]").val(cmd);
            $onerow.eq(idx).find("[name=writevalue]").val(act);
            $onerow.eq(idx).find("[name=bwrite]").val('-');
            idx++;
        });
        $onerow.eq(idx-1).find("[name=bwrite]").val('+');
    };

    function fillApplyActions(mfields) {
        var numrows = $("#applytable tr").length - 1;
        var required = Object.keys(mfields).length;

        while (required > numrows) {
            addRaw($("#applytable"));
            numrows = $("#applytable tr").length - 1;
        }

        var $onerow = $("#applytable tr");
        var idx = 1;
        $.each(mfields, function(index, action) {
            var sep = action.indexOf(":");
            var cmd = action.substring(0,sep)
            var act = action.substring(sep+1)
            
            act=act.replace(" {","").replace("}","").replace(":","=");

            $onerow.eq(idx).find("[name=applyaction]").val(cmd);
            $onerow.eq(idx).find("[name=applyvalue]").val(act);
            $onerow.eq(idx).find("[name=bapply]").val('-');
            idx++;
        });
        $onerow.eq(idx-1).find("[name=bapply]").val('+');
    };

    function fillActions(actions) {
        var apply_actions = [];
        $.each(actions, function(key, value) {
            if( typeof(value) === "string") {
                var cmd = value.split(":");
                switch(cmd[0]) {
                    case "WRITE_METADATA":
                        dm = cmd[1].split("/");
                        $('#metadata').val(+dm[0]);
                        if(dm[1]) {
                            $('#metadata_mask').val(+dm[1]);
                        }
                        break;
                    case "GOTO_TABLE":
                        $('#goto').val(cmd[1]);
                        break;
                    case "METER":
                        $('#meter_id').val(cmd[1]);
                        break;
                    default:
                        apply_actions.push(value);
                }       
            } else {
                var write_actions = value["WRITE_ACTIONS"];
                if (write_actions) {
                    fillWriteActions(write_actions);
                }
            }
        });
        fillApplyActions(apply_actions);
    };
        
    function fillFlowForm(flow) {
        $.each(flow, function(key, value) {
        switch(key) {
            case "dpid":
            case "table_id":
            case "cookie":
                /*dm = value.split("/");
                $('#cookie').val(+dm[0]);
                if(dm[1]) {
                    $('#cookie_mask').val(+dm[1]);
                }*/
            case "priority":
            case "idle_timeout":
            case "hard_timeout": 
                $('#'+key).val(value)
                break;
            case "flags":
                $("#SEND_FLOW_REM").prop('checked', value & 0x01);
                $("#CHECK_OVERLAP").prop('checked', value & 0x02);
                $("#RESET_COUNTS").prop('checked', value & 0x04);
                $("#NO_PKT_COUNTS").prop('checked', value & 0x08);
                $("#NO_BYT_COUNTS").prop('checked', value & 0x10);
                break;
            case "match":
                //fillMatch(JSON.parse(value));
                fillMatch(value);
                break;
            case "actions":
                //fillActions(JSON.parse(value));
                fillActions(value);
                break;
        }})
    }

    return {
        fillFlowForm: fillFlowForm
    };
};