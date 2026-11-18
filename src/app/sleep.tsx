import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { palette as c } from "../constants/palette";
import { Button, Card, Chip, Copy, ErrorMessage, Eyebrow, Field, Heading, Loading, Row, Screen } from "../components/app/ui";
import { useRepository } from "../db/provider";
import { useAction, useResource } from "../lib/hooks";
import { addDays, displayDate, localDateKey } from "../lib/dates";
import { awakeMinutes, formatDuration, recommendedNightDate, restLabels, sleepMinutes, type Restfulness, type SleepNight } from "../features/sleep/model";

type ClockValue = { hour: string; minute: string; period: "AM" | "PM" };
function initialClock(hour: number, minute = 0): ClockValue {
  return { hour: String(hour % 12 || 12), minute: String(minute).padStart(2, "0"), period: hour >= 12 ? "PM" : "AM" };
}
function parseClock(value: ClockValue): string {
  const h = Number(value.hour), m = Number(value.minute);
  if (!/^(1[0-2]|0?[1-9])$/.test(value.hour.trim()) || !/^[0-5]\d$/.test(value.minute.trim()))
    throw new Error("Enter an hour from 1 to 12 and two-digit minutes, such as 9:30.");
  const hour = h % 12 + (value.period === "PM" ? 12 : 0);
  return String(hour).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
function SleepClock({ label, value, onChange }: { label: string; value: ClockValue; onChange: (v: ClockValue) => void }) {
  const h = Number(value.hour) || 12, m = Number(value.minute) || 0;
  return (
    <View style={styles.clockCard}>
      <Text style={styles.clockLabel}>{label}</Text>
      <View style={styles.clockFace} accessibilityLabel={label + " clock preview"}>
        {Array.from({length: 12}, (_, i) => {
          const angle = (i + 1) * Math.PI / 6;
          return <Text key={i} style={[styles.clockNumeral, {left: 63 + 48*Math.sin(angle)-11, top: 63 - 48*Math.cos(angle)-10}]}>{i+1}</Text>;
        })}
        <View style={[styles.hourHand, { transform: [{rotate: ((h%12 + m/60)*30)+"deg"}] }]} />
        <View style={[styles.minuteHand, { transform: [{rotate: (m*6)+"deg"}] }]} />
        <View style={styles.pin} />
      </View>
      <View style={styles.clockInputRow}>
        <View style={{flex: 1}}><Field label="Hour" value={value.hour} maxLength={2} keyboardType="number-pad" onChangeText={hour => onChange({...value,hour})} /></View>
        <View style={{flex: 1}}><Field label="Minute" value={value.minute} maxLength={2} keyboardType="number-pad" onChangeText={minute => onChange({...value,minute})} /></View>
      </View>
      <Row>
        <Chip label="AM" selected={value.period==="AM"} onPress={()=>onChange({...value,period:"AM"})}/>
        <Chip label="PM" selected={value.period==="PM"} onPress={()=>onChange({...value,period:"PM"})}/>
      </Row>
    </View>
  );
}
function SleepSummary({night}: {night:SleepNight}) {
  return <Card>
    <Heading small>{night.completed_at ? "Your sleep report" : "Saved sleep stretches"}</Heading>
    <Eyebrow>{displayDate(night.night_date)}</Eyebrow>
    {night.stretches.map((stretch,i)=><View key={stretch.id} style={styles.stretchRow}>
      <Text style={styles.stretchText}>🌙 {new Date(stretch.started_at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})} – {new Date(stretch.ended_at).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"})}{stretch.estimated ? " · approx." : ""}</Text>
      <Text style={styles.duration}>{formatDuration(Math.round((Date.parse(stretch.ended_at)-Date.parse(stretch.started_at))/60000))}</Text>
    </View>)}
    {night.stretches.length>0 && <View style={styles.summaryRow}>
      <View style={styles.stat}><Text style={styles.statValue}>{formatDuration(sleepMinutes(night.stretches))}</Text><Text style={styles.statLabel}>Total asleep</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{formatDuration(awakeMinutes(night.stretches))}</Text><Text style={styles.statLabel}>Awake between</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{Math.max(0,night.stretches.length-1)}</Text><Text style={styles.statLabel}>Interruptions</Text></View>
    </View>}
    {night.restfulness != null && <Copy>You felt: {restLabels[night.restfulness-1]} ({night.restfulness}/5)</Copy>}
    {!!night.subjective_note && <Copy>{night.subjective_note}</Copy>}
  </Card>;
}
export default function SleepScreen() {
  const repository = useRepository(), action = useAction();
  const resource = useResource(() => repository.sleepNights());
  const nights = resource.data ?? [], draft = nights.find(n=>!n.completed_at), completed = nights.filter(n=>!!n.completed_at);
  const [nightDate,setNightDate] = useState(recommendedNightDate);
  const [start,setStart] = useState<ClockValue>(()=>initialClock(21));
  const [end,setEnd] = useState<ClockValue>(()=>initialClock(7));
  const [estimated,setEstimated] = useState(false);
  const [stretchNote,setStretchNote] = useState("");
  const [rest,setRest] = useState<Restfulness | null>(null);
  const [restNote,setRestNote] = useState("");
  const [showFinish,setShowFinish] = useState(false);
  const [showHistory,setShowHistory] = useState(false);
  function addStretch(){
    void action.run(async ()=>{
      const from=parseClock(start), to=parseClock(end);
      let current=draft;
      if (!current) {
        await repository.startSleepNight(nightDate);
        current=await repository.currentSleepNight() ?? undefined;
      }
      if (!current) throw new Error("Could not create your sleep night. Try again.");
      await repository.addSleepStretch(current.id,from,to,estimated,stretchNote);
      const refreshed = await repository.currentSleepNight();
      const last = refreshed?.stretches[refreshed.stretches.length-1];
      if(last){
        const after=new Date(Date.parse(last.ended_at)+3600000);
        const wake=new Date(Date.parse(last.ended_at)+5*3600000);
        setStart(initialClock(after.getHours(),after.getMinutes()));
        setEnd(initialClock(wake.getHours(),wake.getMinutes()));
      }
      setStretchNote("");
      setEstimated(false);
      await resource.reload();
    });
  }
  const latest = completed[0];
  const lastWeek=completed.filter(n=>n.wake_date>=addDays(localDateKey(),-6) && n.stretches.length);
  const average=lastWeek.length ? Math.round(lastWeek.reduce((sum,n)=>sum+sleepMinutes(n.stretches),0)/lastWeek.length) : null;
  return <Screen>
    <Eyebrow>Sleep journal</Eyebrow>
    <Heading>Let the night tell its story.</Heading>
    <Copy muted>John’s manual-clock approach, made for Open Chair. No timer to remember at 2 AM. Log the times you slept whenever you can.</Copy>
    {!draft && <Card tinted>
      <Heading small>Night starting</Heading>
      <Copy>{displayDate(nightDate)}</Copy>
      <Row><Button secondary label="← Earlier" onPress={()=>setNightDate(d=>addDays(d,-1))}/><Button secondary label="Later →" disabled={nightDate>=localDateKey()} onPress={()=>setNightDate(d=>addDays(d,1))}/></Row>
    </Card>}
    <View style={styles.clockGrid}>
      <SleepClock label="Fell asleep" value={start} onChange={setStart}/>
      <SleepClock label="Woke up" value={end} onChange={setEnd}/>
    </View>
    <Row><Chip label="Times are approximate" selected={estimated} onPress={()=>setEstimated(e=>!e)}/></Row>
    <Field label="A note about this stretch (optional)" value={stretchNote} maxLength={160} onChangeText={setStretchNote} placeholder="Woke up, read for a while…" />
    <ErrorMessage message={action.error} />
    <Button label={action.busy ? "Saving..." : "+ Save this sleep stretch"} disabled={action.busy} onPress={addStretch} />
    {draft && <>
      <SleepSummary night={draft}/>
      <Button secondary disabled={action.busy||!draft.stretches.length} label="↶ Undo last stretch" onPress={()=>void action.run(async()=>{await repository.undoLastSleepStretch(draft.id);await resource.reload();})}/>
      <Button secondary disabled={action.busy||!!draft.stretches.length} label="Discard empty night" onPress={()=>void action.run(async()=>{await repository.discardEmptySleepNight(draft.id);await resource.reload();})}/>
      {!showFinish && <Button label="☀️ I&apos;m up for the day" disabled={!draft.stretches.length||action.busy} onPress={()=>setShowFinish(true)}/>}
      {showFinish && <Card tinted>
        <Heading small>How rested do you feel?</Heading>
        <Copy>Hours aren't the whole story. Your own experience matters.</Copy>
        {restLabels.map((label,i)=><Pressable key={label} accessibilityRole="button" accessibilityState={{selected:rest===i+1}} onPress={()=>setRest((i+1) as Restfulness)} style={[styles.restChoice,rest===i+1&&styles.restSelected]}>
          <Text style={styles.restText}>{["😫","😴","😐","🙂","😃"][i]}  {label}</Text>
        </Pressable>)}
        <Field label="Anything worth noting? (optional)" value={restNote} onChangeText={setRestNote} maxLength={500} multiline placeholder="Dreams, interruptions, how you felt…" />
        <ErrorMessage message={action.error}/>
        <Button label="Finish & see my sleep report" disabled={rest===null||action.busy} onPress={()=>void action.run(async()=>{
          if (rest===null) throw new Error("Choose how rested you feel.");
          await repository.finishSleepNight(draft.id,rest,restNote);
          setShowFinish(false);setRest(null);setRestNote("");
          await resource.reload();
          Alert.alert("Sleep saved","Your night is saved in My Days.");
        })}/>
        <Button secondary label="Back to clocks" onPress={()=>setShowFinish(false)}/>
      </Card>}
    </>}
    {latest && !draft && <SleepSummary night={latest}/>}
    <Card>
      <Heading small>Last 7 days</Heading>
      <Copy muted>{lastWeek.length} recorded night{lastWeek.length===1?"":"s"}{average===null?"": " · "+formatDuration(average)+" average sleep"}</Copy>
      <Copy muted>Notice associations between sleep and feelings over time, not proof that one causes the other.</Copy>
    </Card>
    <Button secondary label={showHistory?"Hide previous nights":"Browse previous nights"} onPress={()=>setShowHistory(x=>!x)}/>
    {showHistory&&completed.slice(0,30).map(n=><SleepSummary key={n.id} night={n}/>)}
    {resource.loading&&<Loading/>}
    <ErrorMessage message={resource.error}/>
    {resource.error&&<Button secondary label="Retry loading" onPress={()=>void resource.reload()}/>}
    <Copy muted>Saved privately on this device. Keep Open Chair installed: deleting the app may delete this journal until backup/export is added.</Copy>
  </Screen>;
}
const styles=StyleSheet.create({
  clockGrid:{flexDirection:"row",gap:10,alignItems:"flex-start"},
  clockCard:{flex:1,minWidth:0,backgroundColor:c.surface,borderRadius:18,borderWidth:1,borderColor:c.border,padding:9,gap:10},
  clockLabel:{fontSize:15,fontWeight:"700",color:c.ink,textAlign:"center"},
  clockFace:{width:126,height:126,borderRadius:63,alignSelf:"center",borderWidth:2,borderColor:c.primary,backgroundColor:c.tint,position:"relative",justifyContent:"center",alignItems:"center"},
  clockNumeral:{position:"absolute",width:22,height:20,textAlign:"center",fontSize:12,fontWeight:"700",color:c.ink},
  hourHand:{position:"absolute",height:31,width:4,borderRadius:3,backgroundColor:c.ink,bottom:61,transformOrigin:"center bottom"},
  minuteHand:{position:"absolute",height:43,width:2,borderRadius:2,backgroundColor:c.primary,bottom:61,transformOrigin:"center bottom"},
  pin:{position:"absolute",width:8,height:8,borderRadius:4,backgroundColor:c.ink},
  clockInputRow:{flexDirection:"row",gap:5},
  stretchRow:{flexDirection:"row",justifyContent:"space-between",gap:8},
  stretchText:{fontSize:13,color:c.ink,flex:1},
  duration:{fontWeight:"700",fontSize:13,color:c.primary},
  summaryRow:{flexDirection:"row",gap:6},
  stat:{backgroundColor:c.tint,flex:1,padding:9,borderRadius:12,alignItems:"center",gap:4},
  statValue:{fontSize:14,fontWeight:"700",color:c.primary},
  statLabel:{fontSize:10,color:c.muted,textAlign:"center"},
  restChoice:{padding:13,borderRadius:12,borderWidth:1,borderColor:c.border,backgroundColor:c.surface},
  restSelected:{borderColor:c.primary,borderWidth:2,backgroundColor:c.tint},
  restText:{fontSize:15,color:c.ink,fontWeight:"600"},
});
