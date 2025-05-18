# main.py
import sys
from PyQt5.QtWidgets import QApplication
from gui import PDFTranslatorGUI
from translator import PDFTranslator

def main():
    app = QApplication(sys.argv)
    translator = PDFTranslator()
    gui = PDFTranslatorGUI(translator)
    gui.show()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
