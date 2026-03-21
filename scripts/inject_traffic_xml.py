import os
import re
import argparse

def main():
    parser = argparse.ArgumentParser(description="Inject Heterogeneous Traffic into SUMO Routes")
    parser.add_argument("--map", type=str, default="4X4_grid", help="Simulation folder (e.g., connaught_place)")
    parser.add_argument("--rou", type=str, default="4x4loop.rou.xml", help="Route file to modify (e.g., connaught.rou.xml)")
    args = parser.parse_args()

    # The rest of the script remains the same, just using args.map instead of args.env
    script_dir = os.path.dirname(os.path.abspath(__file__))
    xml_path = os.path.join(script_dir, "..", "ai_core", "simulations", args.map, args.rou)
    
    if not os.path.exists(xml_path):
        print(f"Error: Route file not found at {xml_path}")
        return

    print(f"Reading {xml_path}...")
    with open(xml_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Clean up previous injection if it exists
    if 'id="mixed_traffic"' in content:
        print("Scrubbing previous injection...")
        # Remove everything from the IRC comments down to the closing distribution tag
        content = re.sub(r'<!-- Heterogeneous Traffic Distribution.*?</vTypeDistribution>', '', content, flags=re.DOTALL)


    distribution_xml = """

    <!-- Heterogeneous Traffic Distribution (India) -->
    <vTypeDistribution id="mixed_traffic">
        <vType id="irc_passenger_car" length="5.0" vClass="passenger" guiShape="passenger" color="white" probability="0.55"/>
        <vType id="irc_city_bus" length="12.0" vClass="bus" guiShape="bus" color="blue" probability="0.10"/>
        <vType id="irc_bajaj_auto" length="3.0" vClass="passenger" guiShape="passenger/sedan" color="yellow" probability="0.15"/>
        <vType id="irc_royal_enfield" length="2.0" vClass="motorcycle" guiShape="motorcycle" color="red" probability="0.20"/>
    </vTypeDistribution>
"""

    print("Injecting vTypeDistribution...")
    # Inject right after the opening <routes ...> tag
    content = re.sub(r'(<routes[^>]*>)', r'\1' + distribution_xml, content, count=1)

    print("Updating all vehicles to use type='mixed_traffic'...")
    # Update <vehicle id="X" depart="Y"> to <vehicle id="X" type="mixed_traffic" depart="Y">
    # Note: Only update if type doesn't already exist on that vehicle tag
    content = re.sub(r'<vehicle\s+id="([^"]+)"\s+depart=', r'<vehicle id="\1" type="mixed_traffic" depart=', content)

    print("Writing modified file back...")
    with open(xml_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Done! The {args.rou} file is now updated with realistic Heterogeneous traffic.")

if __name__ == "__main__":
    main()
