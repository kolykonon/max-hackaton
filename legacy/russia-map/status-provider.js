// Replace this URL with a real API implementing {kind, groups, statuses:{[id]:{[group]:status}}}.
// A real provider also needs verified provenance and a revised medical-data UX.
import {GROUPS,STATUS} from './core.js';
export async function loadStatuses(url='./data/demo-statuses.json'){
 const response=await fetch(url);if(!response.ok)throw Error('Не удалось загрузить демостатусы');
 const data=await response.json();
 if(data.kind!=='demo')throw Error('Этот прототип принимает только явно обозначенные демоданные');
 for(const values of Object.values(data.statuses))for(const group of GROUPS)if(!Object.hasOwn(STATUS,values[group]))throw Error('Некорректный демостатус');
 return data;
}
