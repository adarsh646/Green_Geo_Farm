import sys
import re

filepath = r'c:\Users\adars\GeoFarm\GeoFarm\frontend\src\pages\CattleDetails.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to insert the events mapping block right after the closing of behaviorLogs block
# We can find "{behaviorLogs[0].date} • {behaviorLogs[0].total_ruminating} min rumination</span>"
# and the following "</div>\n                      </div>\n                    )}"

pattern = r"(<span>\{behaviorLogs\[0\]\.date\} • \{behaviorLogs\[0\]\.total_ruminating\} min rumination</span>\s*</div>\s*</div>\s*\)\})"

replacement_text = r"""\1
                    {cattle?.events && cattle.events.slice().reverse().map((event, index) => (
                      <div className="cd-history-item" key={event._id || index}>
                        <div className="cd-history-dot" style={{ background: event.eventType === 'Vaccination' ? '#22c55e' : event.eventType === 'Treatment' ? '#ef4444' : '#f59e0b' }}></div>
                        <div className="cd-history-content">
                          <p>{event.eventType}: {event.medicineGiven || event.notes || 'Event Logged'}</p>
                          <span>{new Date(event.eventDate).toLocaleDateString()} {event.doctorName ? '• Dr. ' + event.doctorName : ''}</span>
                        </div>
                      </div>
                    ))}"""

new_content = re.sub(pattern, replacement_text, content)

if new_content == content:
    print("Failed to replace using regex!")
else:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully!")
